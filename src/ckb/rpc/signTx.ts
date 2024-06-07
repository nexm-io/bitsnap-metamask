import { heading, panel, text } from "@metamask/snaps-ui";
import { RequestErrors, SnapError } from "../../errors";
import { Snap } from "../../interface";
import { getAccounts } from "./account";
import { getPrivateKey } from "../utils/account";
import { signRecoverable } from "../../ckb/utils/sign";

export async function ckbSignTx(
  origin: string,
  snap: Snap,
  txMessage: string,
  senderAddress: string
): Promise<string> {
  // let txSkeleton = helpers.TransactionSkeleton(JSON.parse(txMessage));
  // const snapNetwork = await getCurrentNetwork(snap);
  // let _extractedTx = extractTx(txSkeleton, snapNetwork);

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel({
        children: [
          heading("Sign CKB Transaction"),
          text(`Please verify this ongoing Transaction from ${origin}`),
          // divider(),
          // panel({
          //   children: Object.entries(_extractedTx).map(([key, value]) =>
          //     text(`**${key}**:\n ${value}`)
          //   ),
          // }),
        ],
      }),
    },
  });

  const accounts = await getAccounts(snap);
  const privKey = await getPrivateKey(snap, accounts, senderAddress);

  if (result) {
    return signRecoverable(txMessage, privKey.toString("hex"));
  } else {
    throw SnapError.of(RequestErrors.RejectSign);
  }
}
