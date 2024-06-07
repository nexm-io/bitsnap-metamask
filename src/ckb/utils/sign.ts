import { HexString } from "./hasher";
import { ec as EC } from "elliptic";

const ec = new EC("secp256k1");

export function signRecoverable(
  message: HexString,
  privateKey: HexString
): HexString {
  const key = ec.keyFromPrivate(privateKey.replace("0x", ""));
  const { r, s, recoveryParam } = key.sign(message.slice(2), {
    canonical: true,
  });
  if (recoveryParam === null) {
    throw new Error("Sign message failed!");
  }
  const fmtR = r.toString(16).padStart(64, "0");
  const fmtS = s.toString(16).padStart(64, "0");
  const fmtRecoverableParam = recoveryParam.toString(16).padStart(2, "0");
  return "0x" + fmtR + fmtS + fmtRecoverableParam;
}
