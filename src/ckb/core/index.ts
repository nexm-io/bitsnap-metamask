import { BI, helpers } from "@ckb-lumos/lumos";
import { TransactionSkeletonType } from "@ckb-lumos/lumos/helpers";
import { CkbNetwork } from "./interface";

export function extractTx(
  txSkeleton: TransactionSkeletonType,
  network: CkbNetwork
) {
  let extractTx = helpers.createTransactionFromSkeleton(txSkeleton);

  let collectedSum = BI.from(0);
  for (const output of extractTx.outputs) {
    collectedSum = collectedSum.add(output.capacity);
  }

  const transaction = {
    from:
      "\t" +
      txSkeleton.inputs
        .map((input) => helpers.encodeToAddress(input.cellOutput.lock))
        .join("\n\t"),
    to:
      "\t" +
      extractTx.outputs
        .map((output) => helpers.encodeToAddress(output.lock))
        .join("\n\t"),
    value: `${collectedSum} CKB`,
    network: network,
  };

  return transaction;
}
