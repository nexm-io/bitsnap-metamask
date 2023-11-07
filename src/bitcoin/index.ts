import secp256k1 from "secp256k1";
import { BIP32Interface } from "bip32";
import { HDSigner, Psbt } from "bitcoinjs-lib";
import { BitcoinAccount, BitcoinNetwork } from "../interface";
import { PsbtValidator } from "../bitcoin/PsbtValidator";
import { PsbtHelper } from "../bitcoin/PsbtHelper";
import { getNetwork } from "./getNetwork";
import { extractAccountPrivateKeyByPath } from "utils/account";

export class AccountSigner implements HDSigner {
  publicKey: Buffer;
  fingerprint: Buffer;

  private readonly node: BIP32Interface;
  constructor(accountNode: BIP32Interface, mfp?: Buffer) {
    this.node = accountNode;
    this.publicKey = this.node.publicKey;
    this.fingerprint = mfp || this.node.fingerprint;
  }

  derivePath(path: string): HDSigner {
    try {
      let splitPath = path.split("/");
      if (splitPath[0] == "m") {
        splitPath = splitPath.slice(1);
      }
      if (splitPath.length > 2) {
        splitPath = splitPath.slice(-2);
      }
      const childNode = splitPath.reduce((prevHd, indexStr) => {
        let index;
        if (indexStr.slice(-1) === `'`) {
          index = parseInt(indexStr.slice(0, -1), 10);
          return prevHd.deriveHardened(index);
        } else {
          index = parseInt(indexStr, 10);
          return prevHd.derive(index);
        }
      }, this.node);
      return new AccountSigner(childNode, this.fingerprint);
    } catch (e) {
      throw new Error("invalid path");
    }
  }

  sign(hash: Buffer): Buffer {
    return this.node.sign(hash);
  }
}

const validator = (pubkey: Buffer, msghash: Buffer, signature: Buffer) => {
  return secp256k1.ecdsaVerify(
    new Uint8Array(signature),
    new Uint8Array(msghash),
    new Uint8Array(pubkey)
  );
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

  signTx(signers: AccountSigner[]) {
    try {
      for (let i = 0; i < this.tx.data.inputs.length; i++) {
        this.tx.signInput(i, signers[i]);
      }

      // this.tx.signAllInputs(accountSigner);
      if (this.tx.validateSignaturesOfAllInputs(validator)) {
        this.tx.finalizeAllInputs();
        const txId = this.tx.extractTransaction().getId();
        const txHex = this.tx.extractTransaction().toHex();
        return {
          txId,
          txHex,
        };
      } else {
        throw new Error("Signature verification failed");
      }
    } catch (e) {
      console.log(e);
      throw new Error("Sign transaction failed");
    }
  }
}
