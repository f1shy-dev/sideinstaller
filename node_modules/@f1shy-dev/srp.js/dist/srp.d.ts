declare class Group {
    readonly g: bigint;
    readonly n: bigint;
    readonly Label: string;
    readonly ExponentSize: number;
    constructor(g: bigint, n: bigint, label: string, exponentSize: number);
}

declare enum Mode {
    Client = 0,
    Server = 1
}
declare class SRP {
    private ephemeralPrivate;
    private ephemeralPublicA;
    private ephemeralPublicB;
    private x;
    private v;
    private u;
    private k;
    private preMasterKey;
    private readonly group;
    private key;
    private m;
    private cProof;
    private isServerProved;
    private mode;
    private badState;
    constructor(group: Group);
    Setup(mode: Mode, xORv: bigint, k?: bigint | null): Promise<void>;
    setXorV(mode: Mode, xORv: bigint): Promise<void>;
    Verifier(): bigint;
    EphemeralPublic(): Promise<bigint>;
    SetOthersPublic(AorB: bigint): void;
    IsPublicValid(AorB: bigint): boolean;
    Key(): Promise<Uint8Array>;
    M(salt: Uint8Array, username: string): Promise<Uint8Array>;
    ClientProof(): Promise<Uint8Array>;
    GoodServerProof(salt: Uint8Array, username: string, proof: Uint8Array): Promise<boolean>;
    GoodClientProof(proof: Uint8Array): Promise<boolean>;
    private makeLittleK;
    private generateMySecret;
    private makeA;
    private makeB;
    private makeVerifier;
    private isUValid;
    private calculateU;
}

declare function KDFSHA512(salt: Uint8Array, username: string, password: string): Promise<bigint>;
declare function KDFSHA256(salt: Uint8Array, username: string, password: string, usernameInX?: boolean): Promise<bigint>;

declare const _default: {
    SRP: typeof SRP;
    Group: typeof Group;
    G2048: Group;
    G3072: Group;
    G4096: Group;
    G6144: Group;
    G8192: Group;
    KDFSHA512: typeof KDFSHA512;
    Mode: typeof Mode;
    KDFSHA256: typeof KDFSHA256;
};

export { _default as default };
