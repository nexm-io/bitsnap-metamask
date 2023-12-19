import {
  BitcoinAccount,
  BitcoinAccounts,
  BitcoinNetwork,
  ScriptType,
  Snap,
} from "../interface";
import { getPersistedData, updatePersistedData } from "../utils/manageState";
import { deriveAddress } from "../bitcoin/xpubConverter";
import { getNetwork } from "../bitcoin/getNetwork";
import { extractAccountPrivateKey } from "../utils/account";
import { getCurrentNetwork } from "./network";
import { heading, panel, text } from "@metamask/snaps-ui";

const DEFAULT_SCRIPT = ScriptType.P2TR;
const DEFAULT_BITCOIN_ACCOUNTS = {
  [BitcoinNetwork.Main]: {},
  [BitcoinNetwork.Test]: {},
};

export async function getAccounts(
  snap: Snap,
  _network?: BitcoinNetwork
): Promise<BitcoinAccount[]> {
  const snapNetwork: BitcoinNetwork =
    _network ?? (await getCurrentNetwork(snap));
  const accounts = await getPersistedData<BitcoinAccounts>(
    snap,
    "accounts",
    DEFAULT_BITCOIN_ACCOUNTS
  );

  const network = getNetwork(snapNetwork);
  // Add at least one account with default script type
  if (Object.values(accounts[snapNetwork]).length === 0) {
    const {
      node: accountNode,
      mfp,
      path,
    } = await extractAccountPrivateKey(snap, network, DEFAULT_SCRIPT, 0);
    const account = accountNode.neutered();
    const address = deriveAddress(account.publicKey, DEFAULT_SCRIPT, network);

    const defaultAccount: BitcoinAccount = {
      derivationPath: path,
      pubKey: account.publicKey.toString("hex"),
      address,
      mfp: mfp,
      scriptType: DEFAULT_SCRIPT,
    };

    accounts[snapNetwork][address] = defaultAccount;
    await updatePersistedData(snap, "accounts", accounts);
  }
  return Object.values(accounts[snapNetwork]);
}

export async function addAccount(
  snap: Snap,
  scriptType: ScriptType
): Promise<BitcoinAccount> {
  const accounts = await getPersistedData<BitcoinAccounts>(
    snap,
    "accounts",
    DEFAULT_BITCOIN_ACCOUNTS
  );
  const snapNetwork: BitcoinNetwork = await getCurrentNetwork(snap);

  const network = getNetwork(snapNetwork);
  const newIndex = Object.values(accounts[snapNetwork]).filter(
    (account) => account.scriptType === scriptType
  ).length;
  const {
    node: accountNode,
    mfp,
    path,
  } = await extractAccountPrivateKey(snap, network, scriptType, newIndex);
  const account = accountNode.neutered();
  const address = deriveAddress(account.publicKey, scriptType, network);

  const newAccount = {
    derivationPath: path,
    pubKey: account.publicKey.toString("hex"),
    address,
    mfp: mfp,
    scriptType,
  };
  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("Add new account"),
        text(
          `Do you want to add this account ${newAccount.address} to metamask?`
        ),
      ]),
    },
  });
  if (result) {
    accounts[snapNetwork][address] = newAccount;
    await updatePersistedData(snap, "accounts", accounts);
  }
  return newAccount;
}

export async function addAccounts(
  snap: Snap
): Promise<BitcoinAccount[]> {

  const accounts = await getPersistedData<BitcoinAccounts>(
    snap,
    "accounts",
    DEFAULT_BITCOIN_ACCOUNTS
  );
  const snapNetwork: BitcoinNetwork = await getCurrentNetwork(snap);
  const network = getNetwork(snapNetwork);
  var arrAccounts: Array<BitcoinAccount> = [];

  const keys = Object.keys(ScriptType);
  keys.forEach(async (key, index) => {
    const scriptType = key as ScriptType;

    const {
      node: accountNode,
      mfp,
      path,
    } = await extractAccountPrivateKey(snap, network, scriptType, index);
    const account = accountNode.neutered();
    const address = deriveAddress(account.publicKey, scriptType, network);

    const newAccount = {
      derivationPath: path,
      pubKey: account.publicKey.toString("hex"),
      address,
      mfp: mfp,
      scriptType,
    };

    arrAccounts.push(newAccount);
  })

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("Add new accounts"),
        text(
          `Do you want to add 4 types of account to metamask?`
        ),
      ]),
    },
  });


  if (result) {
    arrAccounts.forEach(async function (acc, index) {
      accounts[snapNetwork][acc.address] = acc;
      await updatePersistedData(snap, "accounts", accounts);
    })

  }

  return arrAccounts;

}
