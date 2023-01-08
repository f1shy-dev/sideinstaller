import { Group } from "./group";
import { sumSHA256 } from "./kdf";
import {
  bigIntFromUint8Array,
  constantTimeCompare,
  exp,
  gcd,
  mod,
  stringToUint8Array,
  uint8ArrayFromBigInt,
  xorUint8Array,
} from "./math";

export const MinGroupSize = 2048;
export const MinExponentSize = 32;
export const bigZero = BigInt(0);
export const bigOne = BigInt(1);

export enum Mode {
  Client,
  Server,
}

export class SRP {
  private ephemeralPrivate: bigint;
  private ephemeralPublicA: bigint;
  private ephemeralPublicB: bigint;
  private x: bigint;
  private v: bigint;
  private u: bigint | null;
  private k: bigint;
  private preMasterKey: bigint;
  private readonly group: Group;
  private key: Uint8Array | null;
  private m: Uint8Array | null;
  private cProof: Uint8Array | null;
  private isServerProved: boolean;
  private mode: Mode;
  private badState: boolean;

  constructor(group: Group) {
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

  // setup should be called after the constructor.
  public async Setup(
    mode: Mode,
    xORv: bigint,
    k?: bigint | null
  ): Promise<void> {
    this.mode = mode;
    switch (mode) {
      case Mode.Client:
        this.x = xORv;
        break;
      case Mode.Server:
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
      case Mode.Client:
        this.makeA();
        break;
      case Mode.Server:
        await this.makeB();
        break;
    }

    return;
  }

  public async setXorV(mode: Mode, xORv: bigint): Promise<void> {
    this.mode = mode;
    switch (mode) {
      case Mode.Client:
        this.x = xORv;
        break;
      case Mode.Server:
        this.v = xORv;
        break;
    }

    return;
  }

  public Verifier(): bigint {
    if (this.mode === Mode.Server) {
      throw new Error("server may not produce a verifier");
    }

    return this.makeVerifier();
  }

  public async EphemeralPublic(): Promise<bigint> {
    if (this.mode === Mode.Server) {
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

  // SetOthersPublic sets A if s is the server and B if s is the client.
  //
  // The caller doesn't need to worry about whether this is A or B.
  // They just need to know that they are setting
  // the public ephemeral key received from the other party.
  //
  // The caller *MUST* check for error status and abort the session
  // on error. This setter will invoke IsPublicValid() and error
  // status must be heeded, as the other party may attempt to send
  // a malicious ephemeral public key (A or B).
  public SetOthersPublic(AorB: bigint) {
    if (!this.IsPublicValid(AorB)) {
      this.badState = true;
      this.key = null;
      throw new Error("invalid public exponent");
    }

    if (this.mode === Mode.Server) {
      this.ephemeralPublicA = AorB;
    } else {
      this.ephemeralPublicB = AorB;
    }
  }

  // IsPublicValid checks to see whether public A or B is valid within the group.
  //
  // A client can do very bad things by sending a malicious A to the server.
  // The server can do mildly bad things by sending a malicious B to the client.
  // This method is public in case the user wishes to check those values earlier than using SetOthersPublic(), which
  // also performs this check.
  public IsPublicValid(AorB: bigint): boolean {
    // There are three ways to fail.
    // 1. If we aren't checking with respect to a valid group
    // 2. If public paramater zero or a multiple of M
    // 3. If public parameter is not relatively prime to N (a bad group?)
    if (!this.group) {
      return false;
    }
    if (this.group.g === bigZero) {
      return false;
    }

    let result = mod(AorB, this.group.n);
    if (result === bigZero) {
      // If the result is not negative or positive then return false.
      return false;
    }

    // Return whether or not the greatest common denominator of AorB and n is one.
    return gcd(AorB, this.group.n) === bigOne;
  }

  // Key creates and returns the session Key.
  //
  // Caller MUST check error status.
  //
  // Once the ephemeral public key is received from the other party and properly
  // set, SRP should have enough information to compute the session key.
  //
  // If and only if, each party knowns their respective long term secret
  // (x for client, v for server) will both parties compute the same Key.
  // Be sure to confirm that client and server have the same key before
  // using it.
  //
  // Note that although the resulting key is 256 bits, its effective strength
  // is (typically) far less and depends on the group used.
  // 8 * (SRP.Group.ExponentSize / 2) should provide a reasonable estimate if you
  // need that.
  public async Key(): Promise<Uint8Array> {
    // If the key is already set then just return it.
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

    // Because of tests, we don't want to always recalculate u
    if (!this.isUValid()) {
      await this.calculateU();
    }

    // Check if its valid now, if it wasn't before then it would have been re-calculated.
    // We must refuse to calculate Key when u === 0;
    if (!this.isUValid()) {
      this.badState = true;
      throw new Error("invalid u");
    }

    if (this.ephemeralPrivate === bigZero) {
      throw new Error("cannot make Key with my ephemeral secret");
    }

    let b: bigint;
    let e: bigint;
    if (this.mode === Mode.Server) {
      // S = (Av^u) ^ b
      if (this.v === null || this.ephemeralPublicA === null) {
        throw new Error("not enough is known to create Key");
      }
      b = exp(this.v, this.u, this.group.n);
      b = b * this.ephemeralPublicA;
      e = this.ephemeralPrivate;
    } else {
      // (B - kg^x) ^ (a + ux)
      if (
        this.ephemeralPublicB === null ||
        this.k === null ||
        this.x === null
      ) {
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
    this.key = await sumSHA256(
      stringToUint8Array(this.preMasterKey.toString(16))
    );
    // TODO, OP does an assertion here to make sure the key length is the same as the expected hash length. But there
    //  seems to be no equivalent in JS?
    return this.key;
  }

  // From http://srp.stanford.edu/design.html
  //
  //   Client -> Server:  M = H(H(N) xor H(g), H(I), s, A, B, Key)
  //   Server >- Client: H(A, M, K)
  //
  //   The client must show its proof first
  //
  // To make that useful, we are going to need to define the hash of big ints.
  // We will use math/big Bytes() to get the absolute value as a big-endian byte
  // slice (without padding to size of N)
  // M returns the server's proof of knowledge of key.
  public async M(salt: Uint8Array, username: string): Promise<Uint8Array> {
    if (this.m !== null || this.m?.length > 0) {
      return this.m;
    }
    if (this.key === null) {
      throw new Error("don't try to prove anything before you have the key");
    }

    // First lets work on the H(H(A) ⊕ H(g)) part.
    const nHash = sumSHA256(uint8ArrayFromBigInt(this.group.n));
    const gHash = sumSHA256(uint8ArrayFromBigInt(this.group.g));
    const groupXOR = xorUint8Array(await nHash, await gHash);
    const SHA256Size = 32;
    // Result must be 32 bytes, this is the size of SHA256, if it's anything else something is wrong.
    if (groupXOR.length !== SHA256Size) {
      throw new Error(`XOR had ${groupXOR.length} bytes instead of 32`);
    }
    const groupHash = sumSHA256(groupXOR);
    const usernameHash = sumSHA256(stringToUint8Array(username));
    const A = uint8ArrayFromBigInt(this.ephemeralPublicA);
    const B = uint8ArrayFromBigInt(this.ephemeralPublicB);
    // Build a new byte array allocated to the size we will need.
    let input = new Uint8Array(
      SHA256Size * 2 + salt.length + A.length + B.length + this.key.length
    );
    input.set(await groupHash, 0);
    input.set(await usernameHash, SHA256Size);
    input.set(salt, SHA256Size * 2);
    input.set(A, SHA256Size * 2 + salt.length);
    input.set(B, SHA256Size * 2 + salt.length + A.length);
    input.set(this.key, SHA256Size * 2 + salt.length + A.length + B.length);

    this.m = await sumSHA256(input);
    return this.m;
  }

  // ClientProof constructs the clients proof from which it knows the key.
  public async ClientProof(): Promise<Uint8Array> {
    if (this.mode !== Mode.Server && !this.isServerProved) {
      throw new Error("don't constrict client proof until server is proved");
    }
    if (this.cProof !== null) {
      return this.cProof;
    }
    if (
      this.ephemeralPublicA === null ||
      this.m === null ||
      this.key === null
    ) {
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

  public async GoodServerProof(
    salt: Uint8Array,
    username: string,
    proof: Uint8Array
  ): Promise<boolean> {
    const myM = await this.M(salt, username);
    this.isServerProved = constantTimeCompare(myM, proof);
    return this.isServerProved;
  }

  public async GoodClientProof(proof: Uint8Array): Promise<boolean> {
    let myClientProof: Uint8Array;
    try {
      myClientProof = await this.ClientProof();
    } catch {
      return false;
    }

    return constantTimeCompare(myClientProof, proof);
  }

  // makeLittleK initializes multiplier based on group parameters
  // k = H(N, g)
  // BUG(jpg): Creation of multiplier, little k, does _not_ conform to RFC 5054 padding.
  private async makeLittleK(): Promise<bigint> {
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

  // generateMySecret creates the little a or b
  // According to RFC 5054, this should be at least 32 bytes
  // According to RFC 2631 this should be uniform in the range
  // [2, q-2], where q is the Sophie Germain prime from which
  // N was created.
  // According to RFC 3526 §8 there are some specific sizes depending
  // on the group. We go with RFC 3526 values if available, otherwise
  // a minimum of 32 bytes.
  private generateMySecret(): bigint {
    const eSize = Math.max(this.group.ExponentSize, MinExponentSize);
    let bytes = new Uint8Array(eSize);
    bytes = crypto.getRandomValues(bytes);
    this.ephemeralPrivate = bigIntFromUint8Array(bytes);
    return this.ephemeralPrivate;
  }

  // makeA calculates A (if necessary) and returns it.
  private makeA(): bigint {
    if (!this.group) {
      throw new Error("group not set");
    }
    if (this.mode !== Mode.Client) {
      throw new Error("only the client can make A");
    }

    if (this.ephemeralPrivate === bigZero) {
      // This is odd because generateMySecret already assigns to ephemeralPrivate, not sure what OP is trying to do
      // here.
      this.ephemeralPrivate = this.generateMySecret();
    }

    this.ephemeralPublicA = exp(
      this.group.g,
      this.ephemeralPrivate,
      this.group.n
    );
    return this.ephemeralPublicA;
  }

  private async makeB(): Promise<bigint> {
    // Absolute Prerequisites: Group, isServer, v
    if (!this.group) {
      throw new Error("group not set");
    }
    if (this.mode !== Mode.Server) {
      throw new Error("only the server can make B");
    }
    if (this.v === bigZero) {
      throw new Error("v must be known before B can be calculated");
    }

    // This test is so I'm not lying to gosec wrt to G105
    // No idea if this translates to TS at all, but might as well keep it in to make sure we are doing the same thing.
    if (this.group.n === bigZero) {
      throw new Error("something is wrong if modulus is zero");
    }

    // Generatable prerequisites: k, b if needed
    if (this.k === bigZero) {
      // If k has not been generated
      await this.makeLittleK();
    }

    if (this.ephemeralPrivate === bigZero) {
      // Technically I don't need this assignment because it gets assigned in generateMySecret. But right now just
      // trying to keep the code as similar as possible.
      this.ephemeralPrivate = this.generateMySecret();
    }

    const term2 = exp(this.group.g, this.ephemeralPrivate, this.group.n);
    const term1 = mod(this.k * this.v, this.group.n);
    this.ephemeralPublicB = mod(term1 + term2, this.group.n);

    return this.ephemeralPublicB;
  }

  private makeVerifier(): bigint {
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

  private isUValid(): boolean {
    if (this.u === null || this.badState) {
      this.u = null;
      return false;
    }

    return this.u !== bigZero;
  }

  private async calculateU(): Promise<bigint> {
    if (
      !this.IsPublicValid(this.ephemeralPublicA) ||
      !this.IsPublicValid(this.ephemeralPublicB)
    ) {
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
