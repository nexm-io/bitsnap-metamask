import { CkbAccount, CkbAccounts, CkbNetwork } from "../core/interface";
import { getPersistedData, updatePersistedData } from "../../utils/manageState";
import { Snap } from "../../interface";
import { getCurrentNetwork } from "./network";
import { heading, panel, text } from "@metamask/snaps-ui";
import {
  extractAccountPrivateKey,
  generateAccountFromPrivateKey,
} from "../utils/account";

const DEFAULT_CKB_ACCOUNTS = {
  ["mainnet"]: [] as CkbAccount[],
  ["testnet"]: [] as CkbAccount[],
  ["devnet"]: [] as CkbAccount[],
};

export async function getAccounts(
  snap: Snap,
  _network?: CkbNetwork
): Promise<CkbAccount[]> {
  const snapNetwork: CkbNetwork = _network ?? (await getCurrentNetwork(snap));
  const accounts = await getPersistedData<CkbAccounts>(
    snap,
    "ckbAccounts",
    DEFAULT_CKB_ACCOUNTS
  );

  // create a snap account if there is nothing inside the persist storage
  if (accounts[snapNetwork].length == 0) {
    await createNewSnapAccount(snap, accounts, snapNetwork);
  }

  return Object.values(accounts[snapNetwork]);
}

export async function addAccount(snap: Snap): Promise<CkbAccount | undefined> {
  const accounts = await getPersistedData<CkbAccounts>(
    snap,
    "ckbAccounts",
    DEFAULT_CKB_ACCOUNTS
  );
  const snapNetwork: CkbNetwork = await getCurrentNetwork(snap);
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
  accounts: CkbAccounts,
  snapNetwork: CkbNetwork
) => {
  const newIndex = Object.keys(accounts[snapNetwork]).length;
  const network = await getCurrentNetwork(snap);

  const {
    node: accountNode,
    mfp,
    path,
  } = await extractAccountPrivateKey(snap, network, newIndex);
  const account = accountNode.neutered();
  const _account = generateAccountFromPrivateKey(
    account.privateKey!.toString("hex"),
    network
  );
  const address = _account.address;

  const newCkbAccount: CkbAccount = {
    derivationPath: path,
    pubKey: account.publicKey.toString("hex"),
    address,
    mfp: mfp,
  };

  accounts[snapNetwork].push(newCkbAccount);

  await updatePersistedData(snap, "ckbAccounts", accounts);
  return accounts[snapNetwork][newIndex];
};
