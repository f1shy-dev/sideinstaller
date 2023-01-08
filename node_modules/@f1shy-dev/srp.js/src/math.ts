// Modular exponentiation for a ^ b mod |m|
export function exp(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = mod(base, modulus)
  while (exponent > 0) {
    if (mod(exponent, 2n) === 1n)
      result = (result * base) % modulus;
    exponent = exponent >> 1n;
    base = mod((base * base), modulus);
  }

  return result;
}

export function abs(input: bigint): bigint {
  return input < 0n ? -input : input;
}

export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);

  if (b > a) {
    let temp = a;
    a = b;
    b = temp;
  }

  while (true) {
    a = mod(a, b)
    if (a === 0n) {
      return b;
    }
    b = mod(b, a)
    if (b === 0n) {
      return a;
    }
  }
}

export function xorUint8Array(a: Uint8Array, b: Uint8Array): Uint8Array {
  // lifted straight from https://golang.org/src/crypto/cipher/xor.go
  // Only work with the shorter array to avoid index out of range issues.
  let n = b.length < a.length ? b.length : a.length;
  let dst = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    dst[i] = a[i] ^ b[i];
  }

  return dst;
}

export function constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length != b.length) {
    return false;
  }

  let v: number;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

export function mod(a: bigint, b: bigint): bigint {
  return ((a % b) + b) % b;
}

export function bigIntFromUint8Array(input: Uint8Array): bigint {
  return BigInt(`0x${ uint8ArrayToHex(input) }`);
}

export function uint8ArrayFromBigInt(input: bigint): Uint8Array {
  return hexToUint8Array(input.toString(16));
}

export function hexToUint8Array(hexString: string): Uint8Array {
  if (hexString === undefined) {
    throw RangeError('hexString cannot undefined')
  }

  const hexMatch = hexString.match(/^(0x)?([\da-fA-F]+)$/)
  if (hexMatch == null) {
    throw RangeError('hexString must be a hexadecimal string, e.g. \'0x4dc43467fe91\' or \'4dc43467fe91\'')
  }

  let hex = hexMatch[2]
  hex = (hex.length % 2 === 0) ? hex : '0' + hex

  return Uint8Array.from(hex.match(/[\da-fA-F]{2}/g)!.map((h) => parseInt(h, 16)));
}

export function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

export function stringToUint8Array(input: string): Uint8Array {
  return Uint8Array.from(input, c => c.charCodeAt(0));
}
