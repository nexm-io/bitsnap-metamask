import { divider, heading, panel, text } from "@metamask/snaps-ui";
import { RequestErrors, SnapError } from "../../errors";
import { Snap } from "../../interface";
import { getCurrentNetwork } from "./network";
import { commons, hd, helpers } from "@ckb-lumos/lumos";
import { extractTx } from "../core";
import { getAccounts } from "./account";
import { getPrivateKey } from "../utils/account";

export async function ckbSignTx(
  origin: string,
  snap: Snap,
  txMessage: string,
  senderAddress: string
): Promise<string> {
  let txSkeleton = helpers.TransactionSkeleton(JSON.parse(txMessage));
  const snapNetwork = await getCurrentNetwork(snap);

  let _extractedTx = extractTx(txSkeleton, snapNetwork);

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("Sign CKB Transaction"),
        text(`Please verify this ongoing Transaction from ${origin}`),
        divider(),
        panel(
          Object.entries(_extractedTx).map(([key, value]) =>
            text(`**${key}**:\n ${value}`)
          )
        ),
      ]),
    },
  });

  const accounts = await getAccounts(snap);
  const privKey = await getPrivateKey(snap, accounts, senderAddress);

  if (result) {
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)!.message;
    const Sig = hd.key.signRecoverable(message!, privKey.toString("hex"));
    const tx = helpers.sealTransaction(txSkeleton, [Sig]);
    return JSON.stringify(tx);
  } else {
    throw SnapError.of(RequestErrors.RejectSign);
  }
}
