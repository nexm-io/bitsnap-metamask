import {
  BitcoinAccount,
  BitcoinAccounts,
  BitcoinNetwork,
  ScriptType,
  Snap,
  SnapAccount,
} from "../interface";
import { getPersistedData, updatePersistedData } from "../utils/manageState";
import { deriveAddress } from "../bitcoin/xpubConverter";
import { getNetwork } from "../bitcoin/getNetwork";
import { extractAccountPrivateKey } from "../utils/account";
import { getCurrentNetwork } from "./network";
import { heading, panel, text } from "@metamask/snaps-ui";

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

  return Object.values(accounts[snapNetwork]);
}

export async function addAccount(snap: Snap): Promise<SnapAccount | undefined> {
  const accounts = await getPersistedData<BitcoinAccounts>(
    snap,
    "accounts",
    DEFAULT_BITCOIN_ACCOUNTS
  );
  const snapNetwork: BitcoinNetwork = await getCurrentNetwork(snap);

  const network = getNetwork(snapNetwork);
  const newIndex = Object.keys(accounts[snapNetwork]).length + 1;

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("Add new account"),
        text(`Do you want to add new account #${newIndex}?`),
      ]),
    },
  });

  if (result) {
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
  }

  return undefined;
}
