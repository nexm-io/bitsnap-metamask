import blake2b, { Blake2b } from "blake2b";
import { HashType } from "./script";

export type BytesLike = ArrayLike<number> | ArrayBuffer | string;
const HEX_CACHE = Array.from({ length: 256 }).map((_, i) =>
  i.toString(16).padStart(2, "0")
);

const CHAR_0 = "0".charCodeAt(0); // 48
const CHAR_9 = "9".charCodeAt(0); // 57
const CHAR_A = "A".charCodeAt(0); // 65
const CHAR_F = "F".charCodeAt(0); // 70
const CHAR_a = "a".charCodeAt(0); // 97

function bytifyHex(hex: string): Uint8Array {
  const u8a = Uint8Array.from({ length: hex.length / 2 - 1 });

  for (let i = 2, j = 0; i < hex.length; i = i + 2, j++) {
    const c1 = hex.charCodeAt(i);
    const c2 = hex.charCodeAt(i + 1);

    // prettier-ignore
    const n1 = c1 <= CHAR_9 ? c1 - CHAR_0 : c1 <= CHAR_F ? c1 - CHAR_A + 10 : c1 - CHAR_a + 10
    // prettier-ignore
    const n2 = c2 <= CHAR_9 ? c2 - CHAR_0 : c2 <= CHAR_F ? c2 - CHAR_A + 10 : c2 - CHAR_a + 10

    u8a[j] = (n1 << 4) | n2;
  }

  return u8a;
}

function bytifyArrayLike(xs: ArrayLike<number>): Uint8Array {
  for (let i = 0; i < xs.length; i++) {
    const v = xs[i];
    if (v < 0 || v > 255 || !Number.isInteger(v)) {
      throw new Error("invalid ArrayLike, all elements must be 0-255");
    }
  }

  return Uint8Array.from(xs);
}

export function bytify(bytesLike: BytesLike): Uint8Array {
  if (bytesLike instanceof ArrayBuffer) return new Uint8Array(bytesLike);
  if (bytesLike instanceof Uint8Array) return Uint8Array.from(bytesLike);
  if (typeof bytesLike === "string") return bytifyHex(bytesLike);
  if (Array.isArray(bytesLike)) return bytifyArrayLike(bytesLike);

  throw new Error(`Cannot convert ${bytesLike}`);
}

export function hexify(buf: BytesLike): string {
  let hex = "";

  const u8a = bytify(buf);
  for (let i = 0; i < u8a.length; i++) {
    hex += HEX_CACHE[u8a[i]];
  }

  return "0x" + hex;
}

export function bytifyRawString(rawString: string): Uint8Array {
  const buffer = new ArrayBuffer(rawString.length);
  const view = new DataView(buffer);

  for (let i = 0; i < rawString.length; i++) {
    const c = rawString.charCodeAt(i);
    view.setUint8(i, c);
  }
  return new Uint8Array(buffer);
}

export type HexString = string;
export type Hash = HexString;

type CKBHasherOptions = {
  outLength?: number;
};

export class CKBHasher {
  hasher: Blake2b;
  outLength: number;

  constructor(options: CKBHasherOptions = {}) {
    const { outLength = 32 } = options;
    this.outLength = outLength;
    this.hasher = blake2b(
      outLength,
      undefined,
      undefined,
      bytifyRawString("ckb-default-hash")
    );
  }

  update(data: string | ArrayBuffer): this {
    this.hasher.update(bytify(data));
    return this;
  }

  digestHex(): Hash {
    const out = new Uint8Array(this.outLength);
    this.hasher.digest(out);
    return hexify(out.buffer);
  }
}

export interface Script {
  codeHash: Hash;
  hashType: HashType;
  args: HexString;
}
