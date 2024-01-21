import { BitcoinNetwork, Snap } from "../interface";
import { SnapError, RequestErrors } from "../errors";
import { heading, panel, text, divider } from "@metamask/snaps-ui";
import { getPrivateKeyAsWIF } from "../utils/account";
import { getCurrentNetwork } from "./network";
import { getAccounts } from "./account";
import { Signer as Bip322Signer } from "bip322-js";
import { bitcoin, testnet } from "bitcoinjs-lib/src/networks";

export async function signMessage(
  origin: string,
  snap: Snap,
  message: string,
  signerAddress: string
): Promise<{ signature: string | Buffer }> {
  const snapNetwork = await getCurrentNetwork(snap);

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("Sign Bitcoin Message"),
        text(`Please verify this ongoing message from ${origin}`),
        divider(),
        panel([text(message)]),
      ]),
    },
  });

  const accounts = (await getAccounts(snap))
    .map((snapAccount) => Object.values(snapAccount))
    .flat();
  const privateKey = await getPrivateKeyAsWIF(snap, accounts, signerAddress);

  if (result) {
    // BIP322
    const signature = Bip322Signer.sign(
      privateKey,
      signerAddress,
      message,
      snapNetwork === BitcoinNetwork.Main ? bitcoin : testnet
    );
    return {
      signature,
    };
  } else {
    throw SnapError.of(RequestErrors.RejectSign);
  }
}
