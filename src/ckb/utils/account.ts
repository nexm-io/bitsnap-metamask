import BIP32Factory, { BIP32Interface } from "bip32";
import { SLIP10Node, JsonSLIP10Node } from "@metamask/key-tree";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { CkbAccount, CkbNetwork } from "../../ckb/core/interface";
import { Snap } from "../../interface";
import offCKB from "../core/offckb.config";
import { RequestErrors, SnapError } from "../../errors";
import { CKBHasher } from "./hasher";
import { encodeToAddress } from "./helpers";

export const CRYPTO_CURVE = "secp256k1";

type Account = {
  address: string;
  pubKey: string;
};

export function publicKeyToBlake160(publicKey: string): string {
  const blake160: string = new CKBHasher()
    .update(publicKey)
    .digestHex()
    .slice(0, 42);

  return blake160;
}

export const generateAccountFromPrivateKey = (
  pubKey: string,
  network: CkbNetwork
): Account => {
  const args = publicKeyToBlake160(pubKey);
  const template = offCKB.lumosConfig(network).SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: args,
  };

  const address = encodeToAddress(lockScript, {
    config: offCKB.lumosConfig(network),
  });

  return {
    address,
    pubKey,
  };
};

export async function extractAccountPrivateKey(
  snap: Snap,
  network: CkbNetwork,
  index: number
): Promise<{ node: BIP32Interface; mfp: string; path: string[] }> {
  const path = ["m", "13'", "0'"];
  if (network === "mainnet") {
    path[path.length - 1] = "0'";
  } else if (network === "testnet") {
    path[path.length - 1] = "1'";
  } else {
    path[path.length - 1] = "2'";
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
    chainCodeBuffer
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
    chainCodeBuffer
  );
  //@ts-ignore
  // ignore checking since no function to set depth for node
  node.__DEPTH = slip10Node.depth;
  //@ts-ignore
  // ignore checking since no function to set index for node
  node.__INDEX = slip10Node.index;

  return node;
}

export async function getPrivateKey(
  snap: Snap,
  accounts: CkbAccount[],
  signerAddress: string
) {
  const signer = accounts.find((account) => account.address === signerAddress);
  if (signer) {
    const accountPrivateKey = await extractAccountPrivateKeyByPath(
      snap,
      signer.derivationPath
    );

    return accountPrivateKey.privateKey;
  } else {
    throw SnapError.of(RequestErrors.AccountNotExisted);
  }
}
