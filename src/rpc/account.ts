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
import { RequestErrors, SnapError } from "../errors";
import { heading, panel, text } from "@metamask/snaps-ui";

const DEFAULT_SCRIPT = ScriptType.P2SH_P2WPKH;
const DEFAULT_BITCOIN_ACCOUNTS = {
  [BitcoinNetwork.Main]: {},
  [BitcoinNetwork.Test]: {},
};

export async function getAccounts(snap: Snap): Promise<BitcoinAccount[]> {
  const snapNetwork: BitcoinNetwork = await getCurrentNetwork(snap);
  const accounts = await getPersistedData<BitcoinAccounts>(
    snap,
    "accounts",
    DEFAULT_BITCOIN_ACCOUNTS
  );

  const network = getNetwork(snapNetwork);
  if (Object.values(accounts[snapNetwork]).length === 0) {
    const { node: accountNode, mfp } = await extractAccountPrivateKey(
      snap,
      network,
      DEFAULT_SCRIPT,
      0
    );
    const account = accountNode.neutered();
    const address = deriveAddress(account.publicKey, DEFAULT_SCRIPT, network);
    // const xpub = convertXpub(
    //   account.toBase58(),
    //   DEFAULT_SCRIPT,
    //   network
    // );

    const defaultAccount = {
      scriptType: DEFAULT_SCRIPT,
      index: 0,
      pubKey: account.publicKey.toString("hex"),
      address,
      mfp: mfp,
    };

    accounts[snapNetwork][address] = defaultAccount;
    await updatePersistedData(snap, "accounts", accounts);
  }
  return Object.values(accounts[snapNetwork]);
}

export async function addAccount(
  snap: Snap,
  scriptType: ScriptType,
  index: number
): Promise<BitcoinAccount> {
  const accounts = await getPersistedData<BitcoinAccounts>(
    snap,
    "accounts",
    DEFAULT_BITCOIN_ACCOUNTS
  );
  const snapNetwork: BitcoinNetwork = await getCurrentNetwork(snap);

  const network = getNetwork(snapNetwork);
  const { node: accountNode, mfp } = await extractAccountPrivateKey(
    snap,
    network,
    scriptType,
    index
  );
  const account = accountNode.neutered();
  const address = deriveAddress(account.publicKey, scriptType, network);
  // const xpub = convertXpub(accountPublicKey.toBase58(), scriptType, network);

  const newAccount = {
    scriptType,
    index,
    pubKey: account.publicKey.toString("hex"),
    address,
    mfp: mfp,
  };
  if (accounts[snapNetwork][address]) {
    throw SnapError.of(RequestErrors.AccountExisted);
  }
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

export async function switchAccount(
  snap: Snap,
  address: string,
  mfp: string
): Promise<BitcoinAccount | null> {
  const snapNetwork: BitcoinNetwork = await getCurrentNetwork(snap);

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("Switch account"),
        text(`Do you want to switch to this account ${address}?`),
      ]),
    },
  });
  if (result) {
    const accounts = await getPersistedData<BitcoinAccounts>(
      snap,
      "accounts",
      DEFAULT_BITCOIN_ACCOUNTS
    );

    if (
      accounts[snapNetwork][address] &&
      accounts[snapNetwork][address].mfp === mfp
    ) {
      await updatePersistedData(
        snap,
        "currentAccount",
        accounts[snapNetwork][address]
      );
      return accounts[snapNetwork][address];
    } else {
      throw SnapError.of(RequestErrors.AccountNotExisted);
    }
  }
  return null;
}

export async function getCurrentAccount(snap: Snap): Promise<BitcoinAccount> {
  const currentAccount = await getPersistedData<BitcoinAccount | undefined>(
    snap,
    "currentAccount",
    undefined
  );
  if (currentAccount) {
    return currentAccount;
  }

  const account = (await getAccounts(snap))[0];
  await updatePersistedData(snap, "currentAccount", account);
  return account;
}
