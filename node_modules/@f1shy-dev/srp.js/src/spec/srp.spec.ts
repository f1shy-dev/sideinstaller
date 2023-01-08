import { G4096 } from '../group';
import { KDFSHA512 } from '../kdf';
import { Mode, SRP } from '../srp';

describe('secure remote password', () => {
  it('will create verifier for credentials', async () => {
    const salt = new Uint8Array([123, 235, 5, 4, 65, 97, 43, 100]);
    const x = await KDFSHA512(salt, 'email@test.com', 'superSecureP@ssw0rd');

    const client = new SRP(G4096);
    await client.Setup(Mode.Client, x, null);

    const verifier = client.Verifier();
    expect(verifier).not.toBeNull();
    // Make sure it contains a portion of the same verifier generated in go.
    expect(verifier.toString()).toContain('5813492424167404793907291556082954358338063393806711129')
  });

  it('will be able to authenticate', async () => {
    const salt = new Uint8Array([123, 235, 5, 4, 65, 97, 43, 100]);
    const username = 'email@test.com'
    const x = await KDFSHA512(salt, username, 'superSecureP@ssw0rd');

    const client = new SRP(G4096);
    await client.Setup(Mode.Client, x, null);

    const A = await client.EphemeralPublic();
    const verifier = client.Verifier();

    const server = new SRP(G4096);
    await server.Setup(Mode.Server, verifier, null);

    // The server will get A (clients ephemeral public key) from the client
    // which the server will set using SetOthersPublic

    // Server MUST check error status here as defense against
    // a malicious A sent by client.
    server.SetOthersPublic(A);

    // server sends its ephemeral public key, B, to client
    // client sets it as others public key.
    const B = await server.EphemeralPublic();
    expect(B).toBeGreaterThan(1);

    // server can now make the key.
    const serverKey = await server.Key();
    expect(serverKey).toHaveLength(32); // The server key should always be 32 bytes.

    // Once the client receives B from the server it can set it.
    // Client should check error status here as defense against
    // a malicious B sent from server
    client.SetOthersPublic(B)

    // client can now make the session key
    const clientKey = await client.Key();
    expect(clientKey).toHaveLength(32); // The client key should always be 32 bytes.
    expect(clientKey).toEqual(serverKey);

    /*** Part 3: Server and client prove they have the same key ***/

      // Server computes a proof, and sends it to the client

    const serverProof = await server.M(salt, username);
    expect(serverProof).toHaveLength(32); // The server proof should be 32 bytes because it is an SHA256 hash.

    const isServerProved = await client.GoodServerProof(salt, username, serverProof);
    expect(isServerProved).toBeTruthy();

    // Only after having a valid server proof will the client construct its own
    const clientProof = await client.ClientProof();
    expect(clientProof).toHaveLength(32);

    const isClientProved = await server.GoodClientProof(clientProof);
    expect(isClientProved).toBeTruthy();
  });
});
