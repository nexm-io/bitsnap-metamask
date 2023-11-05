export interface SignPsbt {
  method: "btc_signPsbt";
  params: {
    psbt: string;
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
    index: number;
  };
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

export interface GetLNDataFromSnap {
  method: "btc_getLNDataFromSnap";
  params: {
    key: KeyOptions;
    walletId?: string;
    type?: "get" | "refresh";
  };
}

export interface SignLNInvoice {
  method: "btc_signLNInvoice";
  params: {
    invoice: string;
  };
}

export type MetamaskBTCRpcRequest =
  | Connect
  | Disconnect
  | IsConnected
  | GetAccounts
  | GetCurrentAccount
  | AddAccount
  | SwitchAccount
  | SignPsbt
  | ManageNetwork
  | SaveLNDataToSnap
  | GetLNDataFromSnap
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
}

export enum BitcoinNetwork {
  Main = "main",
  Test = "test",
}

export interface ConnectedOrigin {
  [origin: string]: {
    [network in BitcoinNetwork]: string[]; // connected pubkeys
  };
}

export interface BitcoinAccount {
  scriptType: ScriptType;
  index: number;
  pubKey: string;
  network: BitcoinNetwork;
  address: string;
  mfp: string;
}

export type BitcoinAccounts = {
  [network in BitcoinNetwork]: {
    [pubKey: string]: BitcoinAccount;
  };
};

export enum KeyOptions {
  Password = "password",
  Credential = "credential",
  PubKey = "pubkey",
}

const LightningAccount = Buffer.from("Lightning").readInt32BE();
export const LNHdPath = `m/84'/0'/${LightningAccount}'/0/0`;

export interface PersistedData {
  network?: BitcoinNetwork;
  origins: ConnectedOrigin;
  accounts: BitcoinAccounts;
  currentAccount?: BitcoinAccount;
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
