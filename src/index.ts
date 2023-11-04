import { Snap, MetamaskBTCRpcRequest } from "./interface";
import {
  signPsbt,
  manageNetwork,
  validateRequest,
  saveLNDataToSnap,
  getLNDataFromSnap,
  signLNInvoice,
} from "./rpc";
import { SnapError, RequestErrors } from "./errors";
import { connect, disconnect, isConnected } from "./rpc/connect";
import {
  addAccount,
  getAccounts,
  getCurrentAccount,
  switchAccount,
} from "./rpc/account";

// @ts-ignore
globalThis.Buffer = require("buffer/").Buffer;

declare let snap: Snap;

export type RpcRequest = {
  origin: string;
  request: MetamaskBTCRpcRequest;
};

export const onRpcRequest = async ({ origin, request }: RpcRequest) => {
  await validateRequest(origin, request);

  switch (request.method) {
    case "btc_signPsbt":
      const psbt = request.params.psbt;
      return signPsbt(origin, snap, psbt);
    // Network
    case "btc_network":
      return manageNetwork(
        origin,
        snap,
        request.params.action,
        request.params.network
      );
    // Connect
    case "btc_connect":
      return connect(
        origin,
        snap,
        request.params.address,
        request.params.network
      );
    case "btc_disconnect":
      return disconnect(
        origin,
        snap,
        request.params.address,
        request.params.network
      );
    case "btc_isConnected":
      return isConnected(
        origin,
        snap,
        request.params.address,
        request.params.network
      );
    // Accounts
    case "btc_getAccounts":
      return getAccounts(snap);
    case "btc_getCurrentAccount":
      return getCurrentAccount(snap);
    case "btc_addAccount":
      return addAccount(snap, request.params.scriptType, request.params.index);
    case "btc_switchAccount":
      return switchAccount(snap, request.params.address, request.params.mfp);
    // Lighting Network
    case "btc_saveLNDataToSnap":
      return saveLNDataToSnap(
        origin,
        snap,
        request.params.walletId,
        request.params.credential,
        request.params.password
      );
    case "btc_getLNDataFromSnap":
      return getLNDataFromSnap(origin, snap, {
        key: request.params.key,
        ...(request.params.walletId && { walletId: request.params.walletId }),
        ...(request.params.type && { type: request.params.type }),
      });
    case "btc_signLNInvoice":
      return signLNInvoice(origin, snap, request.params.invoice);
    default:
      throw SnapError.of(RequestErrors.MethodNotSupport);
  }
};
