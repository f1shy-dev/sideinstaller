import {
  bigIntFromUint8Array,
  hexToUint8Array,
  stringToUint8Array,
} from "./math";

// KDFSHA512 is a key-derivation-function using SHA512 as the inner and outer hash.
export async function KDFSHA512(
  salt: Uint8Array,
  username: string,
  password: string
): Promise<bigint> {
  const innerInput = stringToUint8Array(`${username}:${password}`);
  const innerResult = await sumSHA512(innerInput);

  let outerInput = new Uint8Array(salt.length + innerResult.length);
  outerInput.set(salt, 0);
  outerInput.set(innerResult, salt.length);
  const outerResult = await sumSHA512(outerInput);

  return bigIntFromUint8Array(outerResult);
}

export async function KDFSHA256(
  salt: Uint8Array,
  username: string,
  password: string,
  usernameInX: boolean = true
): Promise<bigint> {
  const innerInput = stringToUint8Array(
    `${usernameInX ? username : ""}:${password}`
  );
  const innerResult = await sumSHA256(innerInput);

  let outerInput = new Uint8Array(salt.length + innerResult.length);
  outerInput.set(salt, 0);
  outerInput.set(innerResult, salt.length);
  const outerResult = await sumSHA256(outerInput);

  return bigIntFromUint8Array(outerResult);
}

export async function sumSHA512(input: Uint8Array): Promise<Uint8Array> {
  return sumHash("SHA-512", input);
}

export async function sumSHA256(input: Uint8Array): Promise<Uint8Array> {
  return sumHash("SHA-256", input);
}

async function sumHash(
  algorithm: AlgorithmIdentifier,
  input: Uint8Array
): Promise<Uint8Array> {
  const result = await crypto.subtle
    .digest(algorithm, input.buffer)
    .then((buf) =>
      Array.prototype.map
        .call(new Uint8Array(buf), (x: number) =>
          ("00" + x.toString(16)).slice(-2)
        )
        .join("")
    );

  return hexToUint8Array(result.toString());
}
