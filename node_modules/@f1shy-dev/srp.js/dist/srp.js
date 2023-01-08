'use strict';

function exp(base, exponent, modulus) {
  if (modulus === 1n)
    return 0n;
  let result = 1n;
  base = mod(base, modulus);
  while (exponent > 0) {
    if (mod(exponent, 2n) === 1n)
      result = result * base % modulus;
    exponent = exponent >> 1n;
    base = mod(base * base, modulus);
  }
  return result;
}
function abs(input) {
  return input < 0n ? -input : input;
}
function gcd(a, b) {
  a = abs(a);
  b = abs(b);
  if (b > a) {
    let temp = a;
    a = b;
    b = temp;
  }
  while (true) {
    a = mod(a, b);
    if (a === 0n) {
      return b;
    }
    b = mod(b, a);
    if (b === 0n) {
      return a;
    }
  }
}
function xorUint8Array(a, b) {
  let n = b.length < a.length ? b.length : a.length;
  let dst = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    dst[i] = a[i] ^ b[i];
  }
  return dst;
}
function constantTimeCompare(a, b) {
  if (a.length != b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
function mod(a, b) {
  return (a % b + b) % b;
}
function bigIntFromUint8Array(input) {
  return BigInt(`0x${uint8ArrayToHex(input)}`);
}
function uint8ArrayFromBigInt(input) {
  return hexToUint8Array(input.toString(16));
}
function hexToUint8Array(hexString) {
  if (hexString === void 0) {
    throw RangeError("hexString cannot undefined");
  }
  const hexMatch = hexString.match(/^(0x)?([\da-fA-F]+)$/);
  if (hexMatch == null) {
    throw RangeError("hexString must be a hexadecimal string, e.g. '0x4dc43467fe91' or '4dc43467fe91'");
  }
  let hex = hexMatch[2];
  hex = hex.length % 2 === 0 ? hex : "0" + hex;
  return Uint8Array.from(hex.match(/[\da-fA-F]{2}/g).map((h) => parseInt(h, 16)));
}
function uint8ArrayToHex(array) {
  return Array.from(array, (byte) => ("0" + (byte & 255).toString(16)).slice(-2)).join("");
}
function stringToUint8Array(input) {
  return Uint8Array.from(input, (c) => c.charCodeAt(0));
}

async function KDFSHA512(salt, username, password) {
  const innerInput = stringToUint8Array(`${username}:${password}`);
  const innerResult = await sumSHA512(innerInput);
  let outerInput = new Uint8Array(salt.length + innerResult.length);
  outerInput.set(salt, 0);
  outerInput.set(innerResult, salt.length);
  const outerResult = await sumSHA512(outerInput);
  return bigIntFromUint8Array(outerResult);
}
async function KDFSHA256(salt, username, password, usernameInX = true) {
  const innerInput = stringToUint8Array(`${usernameInX ? username : ""}:${password}`);
  const innerResult = await sumSHA256(innerInput);
  let outerInput = new Uint8Array(salt.length + innerResult.length);
  outerInput.set(salt, 0);
  outerInput.set(innerResult, salt.length);
  const outerResult = await sumSHA256(outerInput);
  return bigIntFromUint8Array(outerResult);
}
async function sumSHA512(input) {
  return sumHash("SHA-512", input);
}
async function sumSHA256(input) {
  return sumHash("SHA-256", input);
}
async function sumHash(algorithm, input) {
  const result = await crypto.subtle.digest(algorithm, input.buffer).then((buf) => Array.prototype.map.call(new Uint8Array(buf), (x) => ("00" + x.toString(16)).slice(-2)).join(""));
  return hexToUint8Array(result.toString());
}

const MinExponentSize = 32;
const bigZero = BigInt(0);
const bigOne = BigInt(1);
var Mode = /* @__PURE__ */ ((Mode2) => {
  Mode2[Mode2["Client"] = 0] = "Client";
  Mode2[Mode2["Server"] = 1] = "Server";
  return Mode2;
})(Mode || {});
class SRP {
  constructor(group) {
    this.ephemeralPrivate = bigZero;
    this.ephemeralPublicA = bigZero;
    this.ephemeralPublicB = bigZero;
    this.u = null;
    this.k = bigZero;
    this.x = bigZero;
    this.v = bigZero;
    this.preMasterKey = bigZero;
    this.key = null;
    this.group = group;
    this.m = null;
    this.cProof = null;
  }
  async Setup(mode, xORv, k) {
    this.mode = mode;
    switch (mode) {
      case 0 /* Client */:
        this.x = xORv;
        break;
      case 1 /* Server */:
        this.v = xORv;
        break;
    }
    if (k !== null) {
      this.k = k;
    } else {
      await this.makeLittleK();
    }
    this.generateMySecret();
    switch (mode) {
      case 0 /* Client */:
        this.makeA();
        break;
      case 1 /* Server */:
        await this.makeB();
        break;
    }
    return;
  }
  async setXorV(mode, xORv) {
    this.mode = mode;
    switch (mode) {
      case 0 /* Client */:
        this.x = xORv;
        break;
      case 1 /* Server */:
        this.v = xORv;
        break;
    }
    return;
  }
  Verifier() {
    if (this.mode === 1 /* Server */) {
      throw new Error("server may not produce a verifier");
    }
    return this.makeVerifier();
  }
  async EphemeralPublic() {
    if (this.mode === 1 /* Server */) {
      if (this.ephemeralPublicB === bigZero) {
        await this.makeB();
      }
      return this.ephemeralPublicB;
    }
    if (this.ephemeralPublicA === bigZero) {
      this.makeA();
    }
    return this.ephemeralPublicA;
  }
  SetOthersPublic(AorB) {
    if (!this.IsPublicValid(AorB)) {
      this.badState = true;
      this.key = null;
      throw new Error("invalid public exponent");
    }
    if (this.mode === 1 /* Server */) {
      this.ephemeralPublicA = AorB;
    } else {
      this.ephemeralPublicB = AorB;
    }
  }
  IsPublicValid(AorB) {
    if (!this.group) {
      return false;
    }
    if (this.group.g === bigZero) {
      return false;
    }
    let result = mod(AorB, this.group.n);
    if (result === bigZero) {
      return false;
    }
    return gcd(AorB, this.group.n) === bigOne;
  }
  async Key() {
    if (this.key !== null) {
      return this.key;
    }
    if (this.badState) {
      throw new Error("we've got bad data");
    }
    if (!this.group) {
      throw new Error("group not set");
    }
    if (this.group.n === bigZero) {
      throw new Error("group has 0 modulus");
    }
    if (!this.isUValid()) {
      await this.calculateU();
    }
    if (!this.isUValid()) {
      this.badState = true;
      throw new Error("invalid u");
    }
    if (this.ephemeralPrivate === bigZero) {
      throw new Error("cannot make Key with my ephemeral secret");
    }
    let b;
    let e;
    if (this.mode === 1 /* Server */) {
      if (this.v === null || this.ephemeralPublicA === null) {
        throw new Error("not enough is known to create Key");
      }
      b = exp(this.v, this.u, this.group.n);
      b = b * this.ephemeralPublicA;
      e = this.ephemeralPrivate;
    } else {
      if (this.ephemeralPublicB === null || this.k === null || this.x === null) {
        throw new Error("not enough is known to create Key");
      }
      e = this.u * this.x;
      e = e + this.ephemeralPrivate;
      b = exp(this.group.g, this.x, this.group.n);
      b = b * this.k;
      b = this.ephemeralPublicB - b;
      b = mod(b, this.group.n);
    }
    this.preMasterKey = exp(b, e, this.group.n);
    this.key = await sumSHA256(stringToUint8Array(this.preMasterKey.toString(16)));
    return this.key;
  }
  async M(salt, username) {
    if (this.m !== null || this.m?.length > 0) {
      return this.m;
    }
    if (this.key === null) {
      throw new Error("don't try to prove anything before you have the key");
    }
    const nHash = sumSHA256(uint8ArrayFromBigInt(this.group.n));
    const gHash = sumSHA256(uint8ArrayFromBigInt(this.group.g));
    const groupXOR = xorUint8Array(await nHash, await gHash);
    const SHA256Size = 32;
    if (groupXOR.length !== SHA256Size) {
      throw new Error(`XOR had ${groupXOR.length} bytes instead of 32`);
    }
    const groupHash = sumSHA256(groupXOR);
    const usernameHash = sumSHA256(stringToUint8Array(username));
    const A = uint8ArrayFromBigInt(this.ephemeralPublicA);
    const B = uint8ArrayFromBigInt(this.ephemeralPublicB);
    let input = new Uint8Array(SHA256Size * 2 + salt.length + A.length + B.length + this.key.length);
    input.set(await groupHash, 0);
    input.set(await usernameHash, SHA256Size);
    input.set(salt, SHA256Size * 2);
    input.set(A, SHA256Size * 2 + salt.length);
    input.set(B, SHA256Size * 2 + salt.length + A.length);
    input.set(this.key, SHA256Size * 2 + salt.length + A.length + B.length);
    this.m = await sumSHA256(input);
    return this.m;
  }
  async ClientProof() {
    if (this.mode !== 1 /* Server */ && !this.isServerProved) {
      throw new Error("don't constrict client proof until server is proved");
    }
    if (this.cProof !== null) {
      return this.cProof;
    }
    if (this.ephemeralPublicA === null || this.m === null || this.key === null) {
      throw new Error("not enough pieces in place to construct client proof");
    }
    const A = uint8ArrayFromBigInt(this.ephemeralPublicA);
    const input = new Uint8Array(A.length + this.m.length + this.key.length);
    input.set(A, 0);
    input.set(this.m, A.length);
    input.set(this.key, A.length + this.m.length);
    this.cProof = await sumSHA256(input);
    return this.cProof;
  }
  async GoodServerProof(salt, username, proof) {
    const myM = await this.M(salt, username);
    this.isServerProved = constantTimeCompare(myM, proof);
    return this.isServerProved;
  }
  async GoodClientProof(proof) {
    let myClientProof;
    try {
      myClientProof = await this.ClientProof();
    } catch {
      return false;
    }
    return constantTimeCompare(myClientProof, proof);
  }
  async makeLittleK() {
    if (!this.group) {
      throw new Error("group not set");
    }
    const n = uint8ArrayFromBigInt(this.group.n);
    const g = uint8ArrayFromBigInt(this.group.g);
    const total = new Uint8Array(n.length + g.length);
    total.set(n, 0);
    total.set(g, n.length);
    this.k = bigIntFromUint8Array(await sumSHA256(total));
    return this.k;
  }
  generateMySecret() {
    const eSize = Math.max(this.group.ExponentSize, MinExponentSize);
    let bytes = new Uint8Array(eSize);
    bytes = crypto.getRandomValues(bytes);
    this.ephemeralPrivate = bigIntFromUint8Array(bytes);
    return this.ephemeralPrivate;
  }
  makeA() {
    if (!this.group) {
      throw new Error("group not set");
    }
    if (this.mode !== 0 /* Client */) {
      throw new Error("only the client can make A");
    }
    if (this.ephemeralPrivate === bigZero) {
      this.ephemeralPrivate = this.generateMySecret();
    }
    this.ephemeralPublicA = exp(this.group.g, this.ephemeralPrivate, this.group.n);
    return this.ephemeralPublicA;
  }
  async makeB() {
    if (!this.group) {
      throw new Error("group not set");
    }
    if (this.mode !== 1 /* Server */) {
      throw new Error("only the server can make B");
    }
    if (this.v === bigZero) {
      throw new Error("v must be known before B can be calculated");
    }
    if (this.group.n === bigZero) {
      throw new Error("something is wrong if modulus is zero");
    }
    if (this.k === bigZero) {
      await this.makeLittleK();
    }
    if (this.ephemeralPrivate === bigZero) {
      this.ephemeralPrivate = this.generateMySecret();
    }
    const term2 = exp(this.group.g, this.ephemeralPrivate, this.group.n);
    const term1 = mod(this.k * this.v, this.group.n);
    this.ephemeralPublicB = mod(term1 + term2, this.group.n);
    return this.ephemeralPublicB;
  }
  makeVerifier() {
    if (!this.group) {
      throw new Error("group not set");
    }
    if (this.badState) {
      throw new Error("we have bad data");
    }
    if (this.x === bigZero) {
      throw new Error("x must be known to calculate v");
    }
    this.v = exp(this.group.g, this.x, this.group.n);
    return this.v;
  }
  isUValid() {
    if (this.u === null || this.badState) {
      this.u = null;
      return false;
    }
    return this.u !== bigZero;
  }
  async calculateU() {
    if (!this.IsPublicValid(this.ephemeralPublicA) || !this.IsPublicValid(this.ephemeralPublicB)) {
      this.u = null;
      throw new Error("both A and B must be known to calculate u");
    }
    const hexPublicA = this.ephemeralPublicA.toString(16).toLowerCase();
    const hexPublicB = this.ephemeralPublicB.toString(16).toLowerCase();
    const h = await sumSHA256(stringToUint8Array(hexPublicA + hexPublicB));
    this.u = bigIntFromUint8Array(h);
    if (this.u === bigZero) {
      throw new Error("u === 0, which is a bad thing");
    }
    return this.u;
  }
}

class Group {
  constructor(g, n, label, exponentSize) {
    this.g = g;
    this.n = n;
    this.Label = label;
    this.ExponentSize = exponentSize;
  }
}
const G2048 = new Group(BigInt(2), BigInt("0xAC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC3192943DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FBD5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF747359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E7303CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB694B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F9E4AFF73"), "5054A2048", 27);
const G3072 = new Group(BigInt(5), BigInt("0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF"), "5054A3072", 32);
const G4096 = new Group(BigInt(5), BigInt("0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C934063199FFFFFFFFFFFFFFFF"), "5054A4096", 38);
const G6144 = new Group(BigInt(5), BigInt("0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DCC4024FFFFFFFFFFFFFFFF"), "5054A6144", 43);
const G8192 = new Group(BigInt(19), BigInt("0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DBE115974A3926F12FEE5E438777CB6A932DF8CD8BEC4D073B931BA3BC832B68D9DD300741FA7BF8AFC47ED2576F6936BA424663AAB639C5AE4F5683423B4742BF1C978238F16CBE39D652DE3FDB8BEFC848AD922222E04A4037C0713EB57A81A23F0C73473FC646CEA306B4BCBC8862F8385DDFA9D4B7FA2C087E879683303ED5BDD3A062B3CF5B3A278A66D2A13F83F44F82DDF310EE074AB6A364597E899A0255DC164F31CC50846851DF9AB48195DED7EA1B1D510BD7EE74D73FAF36BC31ECFA268359046F4EB879F924009438B481C6CD7889A002ED5EE382BC9190DA6FC026E479558E4475677E9AA9E3050E2765694DFC81F56E880B96E7160C980DD98EDD3DFFFFFFFFFFFFFFFFF"), "5054A8192", 48);

var index = {
  SRP,
  Group,
  G2048,
  G3072,
  G4096,
  G6144,
  G8192,
  KDFSHA512,
  Mode,
  KDFSHA256
};

module.exports = index;
//# sourceMappingURL=srp.js.map
