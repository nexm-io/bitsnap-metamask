import { Snap } from "../interface";
import { AccountSigner, BtcTx } from "../bitcoin";
import { getNetwork } from "../bitcoin/getNetwork";
import { SnapError, RequestErrors } from "../errors";
import { heading, panel, text, divider } from "@metamask/snaps-ui";
import { extractAccountPrivateKey } from "../utils/account";
import { getCurrentNetwork } from "./network";
import { getCurrentAccount } from "./account";
import { isConnected } from "./connect";

export async function signPsbt(
  origin: string,
  snap: Snap,
  psbt: string
): Promise<{ txId: string; txHex: string }> {
  const snapNetwork = await getCurrentNetwork(snap);
  const account = await getCurrentAccount(snap);

  if (!isConnected(origin, snap, account.pubKey, snapNetwork)) {
    throw SnapError.of(RequestErrors.DomainNotAllowed);
  }

  const btcTx = new BtcTx(psbt, snapNetwork);
  const txDetails = btcTx.extractPsbtJson();

  const result = await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: panel([
        heading("Sign Bitcoin Transaction"),
        text(`Please verify this ongoing Transaction from ${origin}`),
        divider(),
        panel(
          Object.entries(txDetails).map(([key, value]) =>
            text(`**${key}**:\n ${value}`)
          )
        ),
      ]),
    },
  });

  if (result) {
    const { node: accountPrivateKey, mfp } = await extractAccountPrivateKey(
      snap,
      getNetwork(snapNetwork),
      account.scriptType,
      account.index
    );
    const signer = new AccountSigner(
      accountPrivateKey,
      Buffer.from(mfp, "hex")
    );
    btcTx.validateTx(signer);
    return btcTx.signTx(signer);
  } else {
    throw SnapError.of(RequestErrors.RejectSign);
  }
}
