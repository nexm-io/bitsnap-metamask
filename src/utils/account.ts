import * as bip32 from "bip32";
import { BIP32Interface } from "bip32";
import { Network, networks } from "bitcoinjs-lib";
import { ScriptType, Snap } from "../interface";
import { SLIP10Node, JsonSLIP10Node } from "@metamask/key-tree";

export const pathMap: Record<ScriptType, string[]> = {
  [ScriptType.P2PKH]: ["m", "44'", "0'"],
  [ScriptType.P2SH_P2WPKH]: ["m", "49'", "0'"],
  [ScriptType.P2WPKH]: ["m", "84'", "0'"],
  [ScriptType.P2TR]: ["m", "86'", "0'"],
};

export const CRYPTO_CURVE = "secp256k1";

export async function extractAccountPrivateKey(
  snap: Snap,
  network: Network,
  scriptType: ScriptType,
  index: number
): Promise<{ node: BIP32Interface; mfp: string; path: string[] }> {
  const path = [...pathMap[scriptType]];
  if (network != networks.bitcoin) {
    path[path.length - 1] = "1'";
  }

  const json = (await snap.request({
    method: "snap_getBip32Entropy",
    params: {
      path,
      curve: CRYPTO_CURVE,
    },
  })) as JsonSLIP10Node;

  const slip10Node = await SLIP10Node.fromJSON(json);

  const privateKeyBuffer = Buffer.from(slip10Node.privateKeyBytes);
  const chainCodeBuffer = Buffer.from(slip10Node.chainCodeBytes);
  const node: BIP32Interface = bip32.fromPrivateKey(
    privateKeyBuffer,
    chainCodeBuffer,
    network
  );
  //@ts-ignore
  // ignore checking since no function to set depth for node
  node.__DEPTH = slip10Node.depth;
  //@ts-ignore
  // ignore checking since no function to set index for node
  node.__INDEX = slip10Node.index;

  const mfp =
    slip10Node.masterFingerprint &&
    slip10Node.masterFingerprint.toString(16).padStart(8, "0");

  return {
    node: node.deriveHardened(0).derive(0).derive(index),
    mfp,
    path: [...path, "0'", "0", index.toString()],
  };
}

export async function extractAccountPrivateKeyByPath(
  snap: Snap,
  network: Network,
  path: string[]
): Promise<BIP32Interface> {
  const json = (await snap.request({
    method: "snap_getBip32Entropy",
    params: {
      path,
      curve: CRYPTO_CURVE,
    },
  })) as JsonSLIP10Node;

  const slip10Node = await SLIP10Node.fromJSON(json);

  const privateKeyBuffer = Buffer.from(slip10Node.privateKeyBytes);
  const chainCodeBuffer = Buffer.from(slip10Node.chainCodeBytes);
  const node: BIP32Interface = bip32.fromPrivateKey(
    privateKeyBuffer,
    chainCodeBuffer,
    network
  );
  //@ts-ignore
  // ignore checking since no function to set depth for node
  node.__DEPTH = slip10Node.depth;
  //@ts-ignore
  // ignore checking since no function to set index for node
  node.__INDEX = slip10Node.index;

  return node;
}
