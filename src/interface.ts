export interface SignPsbt {
  method: "btc_signPsbt";
  params: {
    psbt: string;
    signerAddresses: string[];
  };
}

export interface ManageNetwork {
  method: "btc_network";
  params: {
    action: "get" | "set";
    network?: BitcoinNetwork;
  };
}

export interface Connect {
  method: "btc_connect";
  params: {
    address: string;
    network?: BitcoinNetwork;
  };
}

export interface Disconnect {
  method: "btc_disconnect";
  params: {
    address: string;
    network?: BitcoinNetwork;
  };
}

export interface IsConnected {
  method: "btc_isConnected";
  params: {
    address: string;
    network?: BitcoinNetwork;
  };
}

export interface GetAccounts {
  method: "btc_getAccounts";
}

export interface GetCurrentAccount {
  method: "btc_getCurrentAccount";
}

export interface AddAccount {
  method: "btc_addAccount";
  params: {
    scriptType: ScriptType;
  };
}

export interface AddAccounts {
  method: "btc_addAccounts";
}

export interface SwitchAccount {
  method: "btc_switchAccount";
  params: {
    scriptType: ScriptType;
    index: number;
    address: string;
    mfp: string;
  };
}

export interface SaveLNDataToSnap {
  method: "btc_saveLNDataToSnap";
  params: {
    walletId: string;
    credential: string;
    password: string;
  };
}

export interface SignLNInvoice {
  method: "btc_signLNInvoice";
  params: {
    invoice: string;
    signerAddress: string;
  };
}

export type MetamaskBTCRpcRequest =
  | Connect
  | Disconnect
  | IsConnected
  | GetAccounts
  | GetCurrentAccount
  | AddAccount
  | AddAccounts
  | SwitchAccount
  | SignPsbt
  | ManageNetwork
  | SaveLNDataToSnap
  | SignLNInvoice;

export type BTCMethodCallback = (
  originString: string,
  requestObject: MetamaskBTCRpcRequest
) => Promise<unknown>;

export interface Snap {
  registerRpcMessageHandler: (fn: BTCMethodCallback) => unknown;
  request<T>(options: {
    method: string;
    params?: unknown[] | Record<string, any>;
  }): Promise<T>;
}

export enum ScriptType {
  P2PKH = "P2PKH",
  P2SH_P2WPKH = "P2SH-P2WPKH",
  P2WPKH = "P2WPKH",
  P2TR = "P2TR",
}

export enum BitcoinNetwork {
  Main = "mainnet",
  Test = "testnet",
}

export type BitcoinAccount = {
  derivationPath: string[];
  pubKey: string;
  address: string;
  scriptType: ScriptType;
  // master fingerprint of master private key (should be same for all accounts with same script type)
  mfp: string;
};

export type SnapAccount = {
  [scriptType: string]: BitcoinAccount;
};

export type BitcoinAccounts = {
  [network in BitcoinNetwork]: SnapAccount[];
};

export interface PersistedData {
  network?: BitcoinNetwork;
  accounts: BitcoinAccounts;
  lightning?: {
    [walletId: string]: {
      credential: string;
      password: string;
    };
  };
}

export interface SLIP10Node {
  /**
   * The 0-indexed path depth of this node.
   */
  readonly depth: number;

  /**
   * The fingerprint of the master node, i.e., the node at depth 0. May be
   * undefined if this node was created from an extended key.
   */
  readonly masterFingerprint?: number;

  /**
   * The fingerprint of the parent key, or 0 if this is a master node.
   */
  readonly parentFingerprint: number;

  /**
   * The index of the node, or 0 if this is a master node.
   */
  readonly index: number;

  /**
   * The private key of this node.
   */
  readonly privateKey: string;

  /**
   * The public key of this node.
   */
  readonly publicKey: string;

  /**
   * The chain code of this node.
   */
  readonly chainCode: string;

  /**
   * The name of the curve used by the node.
   */
  readonly curve: "ed25519" | "secp256k1";
}
