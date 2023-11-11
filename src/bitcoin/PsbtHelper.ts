import { Psbt, Transaction } from "bitcoinjs-lib";

export class PsbtHelper {
  private tx: Psbt;
  private signerAddresses: string[];

  constructor(psbt: Psbt, signerAddresses: string[]) {
    this.tx = psbt;
    this.signerAddresses = signerAddresses;
  }

  get inputAmount() {
    return this.tx.data.inputs.reduce((total, input, index) => {
      const vout = this.tx.txInputs[index].index;
      // For legeacy utxo (P2PKH) - no witness field
      if (input.nonWitnessUtxo) {
        const prevTx = Transaction.fromHex(
          input.nonWitnessUtxo.toString("hex")
        );
        return total + prevTx.outs[vout].value;
      } else {
        return total + input.witnessUtxo.value;
      }
    }, 0);
  }

  get sendAmount() {
    return this.tx.txOutputs
      .filter((output) => !this.changeAddresses.includes(output.address))
      .reduce((amount, output) => amount + output.value, 0);
  }

  get fee() {
    const outputAmount = this.tx.txOutputs.reduce(
      (amount, output) => amount + output.value,
      0
    );
    return this.inputAmount - outputAmount;
  }

  get fromAddresses() {
    return this.signerAddresses;
  }

  get toAddresses() {
    return this.tx.txOutputs
      .map((output) => output.address)
      .filter((address) => !this.changeAddresses.includes(address));
  }

  get changeAddresses() {
    return this.tx.data.outputs
      .map((output, index) =>
        output.bip32Derivation ? this.tx.txOutputs[index].address : undefined
      )
      .filter((address) => !!address);
  }
}
