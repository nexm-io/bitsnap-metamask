import { Snap, MetamaskBTCRpcRequest } from "./bitcoin/core/interface";
import { signPsbt, manageNetwork, signLNInvoice } from "./bitcoin/rpc";
import { SnapError, RequestErrors } from "./bitcoin/errors";
import { addAccount, getAccounts } from "./bitcoin/rpc/account";
import { initEccLib } from "bitcoinjs-lib";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { signMessage } from "./bitcoin/rpc/signMessage";

// @ts-ignore
globalThis.Buffer = require("buffer/").Buffer;

declare let snap: Snap;

initEccLib(ecc);

export type RpcRequest = {
  origin: string;
  request: MetamaskBTCRpcRequest;
};

export const onRpcRequest = async ({ origin, request }: RpcRequest) => {
  switch (request.method) {
    /// Bitcoin
    // Transaction
    case "btc_signPsbt":
      const { psbt, signerAddresses } = request.params;
      return signPsbt(origin, snap, psbt, signerAddresses);

    // Network
    case "btc_network":
      const { action, network } = request.params;
      return manageNetwork(origin, snap, action, network);

    // Accounts
    case "btc_getAccounts":
      return getAccounts(snap);

    case "btc_addAccount":
      return addAccount(snap);

    // Message
    case "btc_signMessage":
      const { message, signerAddress: address } = request.params;
      return signMessage(origin, snap, message, address);

    // Lighting Network
    case "btc_signLNInvoice":
      const { invoice, signerAddress } = request.params;
      return signLNInvoice(origin, snap, invoice, signerAddress);

    /// CKB
    default:
      throw SnapError.of(RequestErrors.MethodNotSupport);
  }
};
