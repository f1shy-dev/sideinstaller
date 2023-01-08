import { BigInteger } from "jsbn";
export declare function computeVerifier(
  params: SrpParams,
  login: string,
  password: string,
  salt: string
): Uint8Array;
export declare const concat: (b1: Uint8Array, b2: Uint8Array) => Uint8Array;
export declare function bigintFromBuffer(b: Uint8Array): BigInteger;
export declare function bufferFromString(str: string): Uint8Array;
export declare function bufferToHex(b: Uint8Array): string;
export declare function padTo(b: Uint8Array, len: any): Uint8Array;
export declare function padToN(
  number: BigInteger,
  params: SrpParams
): Uint8Array;
export declare function padToH(
  number: BigInteger,
  params: SrpParams
): Uint8Array;
export declare function rasterize(u: Uint8Array): string;
export declare class Client {
  private readonly params;
  private readonly A;
  private readonly k;
  private readonly a_num;
  private K;
  private x;
  private M1;
  private M2;
  private B;
  constructor(params: SrpParams, key: Uint8Array);
  computeX(password: string, salt: Uint8Array, iterations: Number): BigInteger;
  computeA(): Uint8Array;
  computeK(): Uint8Array;
  computeM1(): Uint8Array;
  checkM2(M2: Uint8Array): boolean;
  setB(b: Uint8Array): void;
}
export declare const params: {
  2048: {
    N_length_bits: number;
    N: BigInteger;
    g: BigInteger;
    hash: string;
  };
};
export interface SrpParams {
  N_length_bits: number;
  N: BigInteger;
  g: BigInteger;
  hash: string;
}
