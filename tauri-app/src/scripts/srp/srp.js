import { BigInteger } from "jsbn";
import hash from "hash.js";
import { pbkdf2Sync } from "pbkdf2";
import { bigintToBuf } from "bigint-conversion";
function createHash(name) {
  switch (name) {
    case "sha256":
      return hash.sha256();
    case "sha512":
      return hash.sha512();
    default:
      throw new Error(`Unknown hash algorithm requested: <${name}>`);
  }
}
export function computeVerifier(params, login, password, salt) {
  const l = bufferFromString(login);
  const p = bufferFromString(password);
  const s = bufferFromString(salt);
  const v_num = params.g.modPow(getx(params, l, p, s), params.N);
  return padToN(v_num, params);
}
function getA(params, a_num) {
  if (Math.ceil(a_num.bitLength() / 8) < 256 / 8) {
    console.warn(
      "getA: client key length",
      a_num.bitLength(),
      "is less than the recommended 256"
    );
  }
  return padToN(params.g.modPow(a_num, params.N), params);
}
function getx(params, password, salt, iterations) {
  let passwordHash = createHash(params.hash).update(password).digest();

  let encryptedPassword = pbkdf2Sync(
    Buffer.from(passwordHash),
    salt,
    iterations,
    32,
    "sha256"
  );
  const hashIP = createHash(params.hash)
    .update(concat(bufferFromString(":"), encryptedPassword))
    .digest();
  const hashX = createHash(params.hash).update(salt).update(hashIP).digest();
  return bigintFromBuffer(new Uint8Array(hashX));
}
function getk(params) {
  var k_buf = createHash(params.hash)
    .update(padToN(params.N, params))
    .update(padToN(params.g, params))
    .digest();
  return bigintFromBuffer(new Uint8Array(k_buf));
}
function getu(params, A, B) {
  var u_buf = createHash(params.hash).update(A).update(B).digest();
  return bigintFromBuffer(new Uint8Array(u_buf));
}
function client_getS(params, k_num, x_num, a_num, B_num, u_num) {
  var g = params.g;
  var N = params.N;
  if (BigInteger.ZERO.compareTo(B_num) >= 0 || N.compareTo(B_num) <= 0)
    throw new Error("invalid server-supplied 'B', must be 1..N-1");
  var S_num = B_num.subtract(k_num.multiply(g.modPow(x_num, N)))
    .modPow(a_num.add(u_num.multiply(x_num)), N)
    .mod(N);
  return padToN(S_num, params);
}
function getM1(params, A_buf, B_buf, K_buf, username, salt) {
  //i = H(g) xor H(N)
  //M1 = H(i) + H(I) + H(salt) + H(A) + H(B) + H(K)

  //H(g) xor H(N)
  let g_buf = bigintToBuf(params.g);
  let N_buf = bigintToBuf(params.N);

  //xor
  let i = new Uint8Array(g_buf.length);
  for (let j = 0; j < g_buf.length; j++) {
    i[j] = g_buf[j] ^ N_buf[j];
  }

  const h = createHash(params.hash)
    .update(i)
    .update(username)
    .update(salt)
    .update(A_buf)
    .update(B_buf)
    .update(K_buf)
    .digest();
  return new Uint8Array(h);
}

function getM2(params, A_buf, M_buf, K_buf) {
  const h = createHash(params.hash)
    .update(A_buf)
    .update(M_buf)
    .update(K_buf)
    .digest();
  return new Uint8Array(h);
}
function getK(params, S_buf) {
  const h = createHash(params.hash).update(S_buf).digest();
  return new Uint8Array(h);
}
export const concat = (b1, b2) => {
  return new Uint8Array([
    ...Array.from(b1),
    ":".charCodeAt(0),
    ...Array.from(b2),
  ]);
};
export function bigintFromBuffer(b) {
  return new BigInteger(bufferToHex(b), 16);
}
export function bufferFromString(str) {
  return new Uint8Array(utf8ToBytes(str, 0));
}
export function bufferToHex(b) {
  return Array.from(b).map(i2hex).join("");
}
export function padTo(b, len) {
  var padding = len - b.length;
  var result = new Array(len);
  result.fill(0, 0, padding);
  for (let i = 0; i < b.length; i++) {
    result[i + padding] = b[i];
  }
  return new Uint8Array(result);
}
export function padToN(number, params) {
  return padTo(new Uint8Array(number.toByteArray()), params.N_length_bits / 8);
}
export function padToH(number, params) {
  var hashlen_bits;
  if (params.hash === "sha1") hashlen_bits = 160;
  else if (params.hash === "sha256") hashlen_bits = 256;
  else if (params.hash === "sha512") hashlen_bits = 512;
  else throw Error("cannot determine length of hash '" + params.hash + "'");
  return padTo(new Uint8Array(number.toByteArray()), hashlen_bits / 8);
}
function i2hex(i) {
  return ("0" + i.toString(16)).slice(-2);
}
export function rasterize(u) {
  const a = Array.from(u);
  let s = "[";
  for (let i = 0; i < a.length; i++) {
    s = s + `${a[i]}`;
    if (i < a.length - 1) s = `${s}, `;
  }
  s = `${s}]`;
  return s;
}
function utf8ToBytes(string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];
  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);
    if (codePoint > 0xd7ff && codePoint < 0xe000) {
      if (!leadSurrogate) {
        if (codePoint > 0xdbff) {
          if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
          continue;
        } else if (i + 1 === length) {
          if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 0xdc00) {
        if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
        leadSurrogate = codePoint;
        continue;
      }
      codePoint =
        (((leadSurrogate - 0xd800) << 10) | (codePoint - 0xdc00)) + 0x10000;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
    }
    leadSurrogate = null;
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break;
      bytes.push((codePoint >> 0x6) | 0xc0, (codePoint & 0x3f) | 0x80);
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(
        (codePoint >> 0xc) | 0xe0,
        ((codePoint >> 0x6) & 0x3f) | 0x80,
        (codePoint & 0x3f) | 0x80
      );
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break;
      bytes.push(
        (codePoint >> 0x12) | 0xf0,
        ((codePoint >> 0xc) & 0x3f) | 0x80,
        ((codePoint >> 0x6) & 0x3f) | 0x80,
        (codePoint & 0x3f) | 0x80
      );
    } else {
      throw new Error("Invalid code point");
    }
  }
  return bytes;
}
export class Client {
  constructor(params, key) {
    this.params = params;
    this.a_num = bigintFromBuffer(key);
    this.A = getA(params, this.a_num);
    this.k = getk(params);
  }
  computeX(password, salt, iterations) {
    this.x = getx(this.params, bufferFromString(password), salt, iterations);
    return this.x;
  }
  computeA() {
    return this.A;
  }
  computeK() {
    return this.K;
  }
  computeM1() {
    if (this.M1 === undefined || this.M1 === null)
      throw new Error("Client::setB must be called first");
    return this.M1;
  }
  checkM2(M2) {
    if (
      this.M1 === undefined ||
      this.M1 === null ||
      this.M2 === undefined ||
      this.M2 === null
    )
      throw new Error("Client::setB must be called first");
    return (
      JSON.stringify(Array.from(this.M2.valueOf())) ===
      JSON.stringify(Array.from(M2.valueOf()))
    );
  }
  setB(b, username, salt) {
    this.B = b;
    const b_num = bigintFromBuffer(b);
    const u_num = getu(this.params, this.A, this.B);
    const S_buf = client_getS(
      this.params,
      this.k,
      this.x,
      this.a_num,
      b_num,
      u_num
    );
    this.K = getK(this.params, S_buf);
    this.M1 = getM1(this.params, this.A, this.B, this.K, username, salt);
    this.M2 = getM2(this.params, this.A, this.M1, this.K);
  }
}
export const params = {
  2048: {
    N_length_bits: 2048,
    N: hex(
      " AC6BDB41 324A9A9B F166DE5E 1389582F AF72B665 1987EE07 FC319294" +
        "3DB56050 A37329CB B4A099ED 8193E075 7767A13D D52312AB 4B03310D" +
        "CD7F48A9 DA04FD50 E8083969 EDB767B0 CF609517 9A163AB3 661A05FB" +
        "D5FAAAE8 2918A996 2F0B93B8 55F97993 EC975EEA A80D740A DBF4FF74" +
        "7359D041 D5C33EA7 1D281E44 6B14773B CA97B43A 23FB8016 76BD207A" +
        "436C6481 F1D2B907 8717461A 5B9D32E6 88F87748 544523B5 24B0D57D" +
        "5EA77A27 75D2ECFA 032CFBDB F52FB378 61602790 04E57AE6 AF874E73" +
        "03CE5329 9CCC041C 7BC308D8 2A5698F3 A8D0C382 71AE35F8 E9DBFBB6" +
        "94B5C803 D89F7AE4 35DE236D 525F5475 9B65E372 FCD68EF2 0FA7111F" +
        "9E4AFF73"
    ),
    g: hex("02"),
    hash: "sha256",
  },
};
function hex(s) {
  return new BigInteger(s.split(/\s/).join(""), 16);
}
