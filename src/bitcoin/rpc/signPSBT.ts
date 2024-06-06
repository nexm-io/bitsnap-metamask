import { BtcTx } from "../core";
import { SnapError, RequestErrors } from "../../errors";
import { heading, panel, text, divider } from "@metamask/snaps-ui";
import { getSigner } from "../utils/account";
import { getCurrentNetwork } from "./network";
import { getAccounts } from "./account";
import { Signer } from "bitcoinjs-lib";
import { Snap } from "../../interface";

export async function signPsbt(
  origin: string,
  snap: Snap,
  psbt: string,
  signerAddresses: string[]
): Promise<{ txId: string; txHex: string }> {
  const snapNetwork = await getCurrentNetwork(snap);

  const btcTx = new BtcTx(psbt, snapNetwork, signerAddresses);
  const txDetails = btcTx.extractPsbtJson();

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel({
        children: [
          heading("Sign Bitcoin Transaction"),
          text(`Please verify this ongoing Transaction from ${origin}`),
          divider(),
          panel({
            children: Object.entries(txDetails).map(([key, value]) =>
              text(`**${key}**:\n ${value}`)
            ),
          }),
        ],
      }),
    },
  });

  const accounts = (await getAccounts(snap))
    .map((snapAccount) => Object.values(snapAccount))
    .flat();
  const signers: Signer[] = [];
  for (const signerAddress of signerAddresses) {
    signers.push(await getSigner(snap, accounts, signerAddress));
  }

  if (result) {
    btcTx.validateTx();
    return btcTx.signTx(signers);
  } else {
    throw SnapError.of(RequestErrors.RejectSign);
  }
}
