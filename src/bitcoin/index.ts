import secp256k1 from "secp256k1";
import { BIP32Interface } from "bip32";
import { Signer, Psbt } from "bitcoinjs-lib";
import { BitcoinNetwork } from "../interface";
import { PsbtValidator } from "../bitcoin/PsbtValidator";
import { PsbtHelper } from "../bitcoin/PsbtHelper";
import { getNetwork } from "./getNetwork";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { isTaprootInput } from "bitcoinjs-lib/src/psbt/bip371";

export class AccountSigner implements Signer {
  publicKey: Buffer;
  fingerprint: Buffer;

  private readonly node: BIP32Interface;
  constructor(accountNode: BIP32Interface, mfp?: Buffer) {
    this.node = accountNode;
    this.publicKey = this.node.publicKey;
    this.fingerprint = mfp || this.node.fingerprint;
  }

  sign(hash: Buffer): Buffer {
    return this.node.sign(hash);
  }

  signSchnorr(hash: Buffer): Buffer {
    return this.node.signSchnorr(hash);
  }
}

const ecdsaValidator = (pubkey: Buffer, msghash: Buffer, signature: Buffer) => {
  return secp256k1.ecdsaVerify(
    new Uint8Array(signature),
    new Uint8Array(msghash),
    new Uint8Array(pubkey)
  );
};

const schnorrValidator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer
) => {
  return ecc.verifySchnorr(msghash, pubkey, signature);
};

export class BtcTx {
  private tx: Psbt;
  private network: BitcoinNetwork;

  constructor(base64Psbt: string, network: BitcoinNetwork) {
    this.tx = Psbt.fromBase64(base64Psbt, { network: getNetwork(network) });
    this.network = network;
  }

  validateTx() {
    const validator = new PsbtValidator(this.tx, this.network);
    return validator.validate();
  }

  extractPsbtJson() {
    const psbtHelper = new PsbtHelper(this.tx, this.network);
    const changeAddress = psbtHelper.changeAddresses;
    const unit = this.network === BitcoinNetwork.Main ? "sats" : "tsats";

    const transaction = {
      from: psbtHelper.fromAddresses.join(","),
      to: psbtHelper.toAddresses.join(","),
      value: `${psbtHelper.sendAmount} ${unit}`,
      fee: `${psbtHelper.fee} ${unit}`,
      network: this.network,
    };

    if (changeAddress.length > 0) {
      return { ...transaction, changeAddress: changeAddress.join(",") };
    }
    return transaction;
  }

  extractPsbtJsonString() {
    return Object.entries(this.extractPsbtJson())
      .map(([key, value]) => `${key}: ${value}\n`)
      .join("");
  }

  signTx(signers: Signer[]) {
    try {
      for (let i = 0; i < this.tx.data.inputs.length; i++) {
        this.tx.signInput(i, signers[i]);
        // Validate signature
        if (isTaprootInput(this.tx.data.inputs[i])) {
          if (!this.tx.validateSignaturesOfInput(i, schnorrValidator)) {
            throw new Error("Signature verification failed");
          }
        } else {
          if (!this.tx.validateSignaturesOfInput(i, ecdsaValidator)) {
            throw new Error("Signature verification failed");
          }
        }
      }

      this.tx.finalizeAllInputs();
      const txId = this.tx.extractTransaction().getId();
      const txHex = this.tx.extractTransaction().toHex();
      return {
        txId,
        txHex,
      };
    } catch (e) {
      console.log(e);
      throw new Error("Sign transaction failed");
    }
  }
}
