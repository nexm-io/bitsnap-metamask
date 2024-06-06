export interface SignTx {
  method: "ckb_signTx";
  params: {
    txMessage: string;
    senderAddress: string;
  };
}

export interface ManageNetwork {
  method: "ckb_network";
  params: {
    action: "get" | "set";
    network?: CkbNetwork;
  };
}

export interface GetCkbAccounts {
  method: "ckb_getAccounts";
}

export interface AddCkbAccount {
  method: "ckb_addAccount";
  params: {};
}

export type MetamaskCKBRpcRequest =
  | SignTx
  | ManageNetwork
  | GetCkbAccounts
  | AddCkbAccount;

export type CKBMethodCallback = (
  originString: string,
  requestObject: MetamaskCKBRpcRequest
) => Promise<unknown>;

export type CkbNetwork = "devnet" | "testnet" | "mainnet";

export type CkbAccount = {
  derivationPath: string[];
  pubKey: string;
  address: string;
  // master fingerprint of master private key (should be same for all accounts with same script type)
  mfp: string;
};

export type CkbAccounts = {
  [network in CkbNetwork]: CkbAccount[];
};
