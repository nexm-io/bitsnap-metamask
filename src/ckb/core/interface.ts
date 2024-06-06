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

export type MetamaskCKBRpcRequest = SignTx | ManageNetwork;

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
