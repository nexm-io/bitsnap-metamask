import { Psbt } from "bitcoinjs-lib";
import { BitcoinNetwork } from "./interface";
import { PsbtHelper } from "./PsbtHelper";
import { fromHdPathToObj } from "./cryptoPath";
import { PsbtValidateErrors, SnapError } from "../errors";

const BITCOIN_MAINNET_COIN_TYPE = 0;
const BITCOIN_TESTNET_COIN_TYPE = 1;
const BITCOIN_MAIN_NET_ADDRESS_PATTERN = /^(1|3|bc1)/;
const BITCOIN_TEST_NET_ADDRESS_PATTERN = /^(m|n|2|tb1)/;

export class PsbtValidator {
  static FEE_THRESHOLD = 10000000;
  private readonly tx: Psbt;
  private readonly snapNetwork: BitcoinNetwork;
  private psbtHelper: PsbtHelper;
  private error: SnapError | null = null;
  private signerAddresses: string[];

  constructor(psbt: Psbt, network: BitcoinNetwork, signerAddresses: string[]) {
    this.tx = psbt;
    this.snapNetwork = network;
    this.signerAddresses = signerAddresses;
    this.psbtHelper = new PsbtHelper(this.tx, signerAddresses);
  }

  get coinType() {
    return this.snapNetwork === BitcoinNetwork.Main
      ? BITCOIN_MAINNET_COIN_TYPE
      : BITCOIN_TESTNET_COIN_TYPE;
  }

  everyOutputMatchesNetwork() {
    const addressPattern =
      this.snapNetwork === BitcoinNetwork.Main
        ? BITCOIN_MAIN_NET_ADDRESS_PATTERN
        : BITCOIN_TEST_NET_ADDRESS_PATTERN;
    const result = this.tx.data.outputs.every((output, index) => {
      if (output.bip32Derivation) {
        return output.bip32Derivation.every((derivation) => {
          const { coinType } = fromHdPathToObj(derivation.path);
          return Number(coinType) === this.coinType;
        });
      } else {
        const address = this.tx.txOutputs[index].address;
        return addressPattern.test(address);
      }
    });

    if (!result) {
      this.error = SnapError.of(PsbtValidateErrors.OutputsNetworkNotMatch);
    }
    return result;
  }

  feeUnderThreshold() {
    const result = this.psbtHelper.fee < PsbtValidator.FEE_THRESHOLD;
    if (!result) {
      this.error = SnapError.of(PsbtValidateErrors.FeeTooHigh);
    }
    return result;
  }

  witnessUtxoValueMatchesNoneWitnessOnes() {
    const hasWitnessUtxo = this.tx.data.inputs.some(
      (_, index) => this.tx.getInputType(index) === "witnesspubkeyhash"
    );
    if (!hasWitnessUtxo) {
      return true;
    }

    const witnessAmount = this.tx.data.inputs.reduce((total, input, index) => {
      return total + input.witnessUtxo.value;
    }, 0);
    const result = this.psbtHelper.inputAmount === witnessAmount;

    if (!result) {
      this.error = SnapError.of(PsbtValidateErrors.AmountNotMatch);
    }
    return result;
  }

  inputAndSignerMatchSize() {
    return this.signerAddresses.length === this.tx.txInputs.length;
  }

  validate() {
    this.error = null;

    this.inputAndSignerMatchSize() &&
      this.everyOutputMatchesNetwork() &&
      this.feeUnderThreshold() &&
      this.witnessUtxoValueMatchesNoneWitnessOnes();

    if (this.error) {
      throw this.error;
    }
    return true;
  }
}
