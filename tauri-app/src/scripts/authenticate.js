import srp from "srp-js";

export const authenticate = async () => {
    console.log(`Authenticating with Apple`);

    const salt = new Uint8Array([123, 235, 5, 4, 65, 97, 43, 100]);
    const username = "email@test.com";
    let password = "superSecureP@ssw0rd";
    console.log(
        `generating salt with *****@${username.split("@")[1]
        } and password ${"*".repeat(password.length)}`
    );

    const x = await srp.KDFSHA512
    console.log(`kdfsha512: ${x}`);
    const client = new srp.SRP(srp.G4096);
    await client.Setup(srp.Mode.Client, x, null);

    const A = await client.EphemeralPublic();
    console.log(`client public key A: ${A}`);
};