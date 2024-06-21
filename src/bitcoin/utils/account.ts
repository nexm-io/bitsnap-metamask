import BIP32Factory, { BIP32Interface } from "bip32";
import { Network, networks, crypto } from "bitcoinjs-lib";
import { BitcoinAccount, ScriptType } from "../core/interface";
import { SLIP10Node, JsonSLIP10Node } from "@metamask/key-tree";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { getNetwork } from "../core/getNetwork";
import { RequestErrors, SnapError } from "../../errors";
import { getCurrentNetwork } from "../rpc/network";
import { AccountSigner } from "../core";
import { Snap } from "../../interface";

const toXOnly = (pubKey: Buffer) =>
  pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);

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
  const node: BIP32Interface = BIP32Factory(ecc).fromPrivateKey(
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
  const node: BIP32Interface = BIP32Factory(ecc).fromPrivateKey(
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

export async function getSigner(
  snap: Snap,
  accounts: BitcoinAccount[],
  signerAddress: string
) {
  const snapNetwork = await getCurrentNetwork(snap);
  const signer = accounts.find((account) => account.address === signerAddress);
  if (signer) {
    const accountPrivateKey = await extractAccountPrivateKeyByPath(
      snap,
      getNetwork(snapNetwork),
      signer.derivationPath
    );

    if (signer.derivationPath[1] === "86'") {
      const tweakedChildNode = accountPrivateKey.tweak(
        crypto.taggedHash("TapTweak", toXOnly(accountPrivateKey.publicKey))
      );
      return tweakedChildNode;
    } else {
      return new AccountSigner(accountPrivateKey);
    }
  } else {
    throw SnapError.of(RequestErrors.AccountNotExisted);
  }
}

export async function getPrivateKey(
  snap: Snap,
  accounts: BitcoinAccount[],
  signerAddress: string
) {
  const snapNetwork = await getCurrentNetwork(snap);
  const signer = accounts.find((account) => account.address === signerAddress);
  if (signer) {
    const accountPrivateKey = await extractAccountPrivateKeyByPath(
      snap,
      getNetwork(snapNetwork),
      signer.derivationPath
    );

    return accountPrivateKey.privateKey;
  } else {
    throw SnapError.of(RequestErrors.AccountNotExisted);
  }
}

export async function getPrivateKeyAsWIF(
  snap: Snap,
  accounts: BitcoinAccount[],
  signerAddress: string
) {
  const snapNetwork = await getCurrentNetwork(snap);
  const signer = accounts.find((account) => account.address === signerAddress);
  if (signer) {
    const accountPrivateKey = await extractAccountPrivateKeyByPath(
      snap,
      getNetwork(snapNetwork),
      signer.derivationPath
    );

    return accountPrivateKey.toWIF();
  } else {
    throw SnapError.of(RequestErrors.AccountNotExisted);
  }
}
