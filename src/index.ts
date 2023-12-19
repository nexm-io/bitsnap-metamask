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
import { addAccount, addAccounts, getAccounts } from "./rpc/account";
import { initEccLib } from "bitcoinjs-lib";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";

// @ts-ignore
globalThis.Buffer = require("buffer/").Buffer;

declare let snap: Snap;

initEccLib(ecc);

export type RpcRequest = {
  origin: string;
  request: MetamaskBTCRpcRequest;
};

export const onRpcRequest = async ({ origin, request }: RpcRequest) => {
  await validateRequest(origin, request);

  switch (request.method) {
    case "btc_signPsbt":
      const { psbt, signerAddresses } = request.params;
      return signPsbt(origin, snap, psbt, signerAddresses);

    // Network
    case "btc_network":
      return manageNetwork(
        origin,
        snap,
        request.params.action,
        request.params.network
      );

    // Accounts
    case "btc_getAccounts":
      return getAccounts(snap);

    case "btc_addAccount":
      return addAccount(snap, request.params.scriptType);

    case "btc_addAccounts":
      return addAccounts(snap);

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
