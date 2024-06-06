import {
  BitcoinAccounts,
  BitcoinNetwork,
  BTCMethodCallback,
} from "./bitcoin/core/interface";
import {
  CkbAccounts,
  CKBMethodCallback,
  CkbNetwork,
} from "./ckb/core/interface";

export interface Snap {
  registerRpcMessageHandler: (
    fn: BTCMethodCallback | CKBMethodCallback
  ) => unknown;
  request<T>(options: {
    method: string;
    params?: unknown[] | Record<string, any>;
  }): Promise<T>;
}

export interface PersistedData {
  // Bitcoin
  network?: BitcoinNetwork;
  accounts: BitcoinAccounts;
  lightning?: {
    [walletId: string]: {
      credential: string;
      password: string;
    };
  };
  // CKB
  ckbNetwork?: CkbNetwork;
  ckbAccounts: CkbAccounts;
}
