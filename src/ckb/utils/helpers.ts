import { Script } from "./hasher";
import { Address, Config } from "./script";
import { bech32m } from "bech32";
import { bytes } from "@ckb-lumos/codec";
import { HashType } from "@ckb-lumos/base/lib/blockchain";

export interface Options {
  config?: Config;
}

const BECH32_LIMIT = 1023;

export function encodeToAddress(
  script: Script,
  { config = undefined }: Options = {}
): Address {
  // https://github.com/nervosnetwork/rfcs/blob/9aef152a5123c8972de1aefc11794cf84d1762ed/rfcs/0021-ckb-address-format/0021-ckb-address-format.md#full-payload-format
  // Full payload format directly encodes all data fields of lock script. The encode rule of full payload format is Bech32m.
  // payload = 0x00 | code_hash | hash_type | args

  const data = bytes.concat(
    [0x00],
    script.codeHash,
    HashType.pack(script.hashType),
    script.args
  );

  return bech32m.encode(config.PREFIX, bech32m.toWords(data), BECH32_LIMIT);
}
