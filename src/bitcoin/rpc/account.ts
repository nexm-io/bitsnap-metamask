import {
  BitcoinAccount,
  BitcoinAccounts,
  BitcoinNetwork,
  ScriptType,
  SnapAccount,
} from "../core/interface";
import { getPersistedData, updatePersistedData } from "../../utils/manageState";
import { deriveAddress } from "../core/xpubConverter";
import { getNetwork } from "../core/getNetwork";
import { extractAccountPrivateKey } from "../utils/account";
import { getCurrentNetwork } from "./network";
import { heading, Panel, panel, text } from "@metamask/snaps-ui";
import { Snap } from "../../interface";

const DEFAULT_BITCOIN_ACCOUNTS = {
  [BitcoinNetwork.Main]: [] as SnapAccount[],
  [BitcoinNetwork.Test]: [] as SnapAccount[],
};

export async function getAccounts(
  snap: Snap,
  _network?: BitcoinNetwork
): Promise<SnapAccount[]> {
  const snapNetwork: BitcoinNetwork =
    _network ?? (await getCurrentNetwork(snap));
  const accounts = await getPersistedData<BitcoinAccounts>(
    snap,
    "accounts",
    DEFAULT_BITCOIN_ACCOUNTS
  );

  // create a snap account if there is nothing inside the persist storage
  if (accounts[snapNetwork].length == 0) {
    await createNewSnapAccount(snap, accounts, snapNetwork);
  }

  return Object.values(accounts[snapNetwork]);
}

export async function addAccount(snap: Snap): Promise<SnapAccount | undefined> {
  const accounts = await getPersistedData<BitcoinAccounts>(
    snap,
    "accounts",
    DEFAULT_BITCOIN_ACCOUNTS
  );
  const snapNetwork: BitcoinNetwork = await getCurrentNetwork(snap);
  const newIndex = Object.keys(accounts[snapNetwork]).length;

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel({
        children: [
          heading("Add new account"),
          text(`Do you want to add new account #${newIndex}?`),
        ],
      }),
    },
  });

  if (result) {
    return await createNewSnapAccount(snap, accounts, snapNetwork);
  }

  return undefined;
}

const createNewSnapAccount = async (
  snap: Snap,
  accounts: BitcoinAccounts,
  snapNetwork: BitcoinNetwork
) => {
  const newIndex = Object.keys(accounts[snapNetwork]).length;
  const network = getNetwork(snapNetwork);

  const newSnapAccount: SnapAccount = {};
  for (const scriptType of Object.values(ScriptType)) {
    const {
      node: accountNode,
      mfp,
      path,
    } = await extractAccountPrivateKey(snap, network, scriptType, newIndex);
    const account = accountNode.neutered();
    const address = deriveAddress(account.publicKey, scriptType, network);

    const newAccount: BitcoinAccount = {
      derivationPath: path,
      pubKey: account.publicKey.toString("hex"),
      address,
      mfp: mfp,
      scriptType,
    };

    newSnapAccount[scriptType] = newAccount;
  }

  accounts[snapNetwork].push(newSnapAccount);

  await updatePersistedData(snap, "accounts", accounts);
  return accounts[snapNetwork][newIndex];
};
