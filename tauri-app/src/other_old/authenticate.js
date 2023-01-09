import srp from "@f1shy-dev/srp.js";
import { getAnisette } from "./anisette";
import { build as buildPlist, parse as parsePlist } from "plist";
import { bigintToBase64, bigintToBuf, bufToBigint } from "bigint-conversion";
import { pbkdf2 } from "pbkdf2";
import { KDFSHA256, sumSHA256 } from "@f1shy-dev/srp.js/src/kdf";
import { showErrorToast } from "../scripts/helpers";
const { fetch, Body: TauriBody } = window.__TAURI__.http;

const authFetch = async (anisette, params) => {
  let body = {
    Header: {
      Version: "1.0.1",
    },
    Request: {
      cpd: {
        ...anisette,
        bootstrap: true, // All implementations set this to true
        icscrec: true, // Only AltServer sets this to true
        pbe: false, // All implementations explicitly set this to false
        prkgen: true,
        svct: "iCloud", // In certain circumstances, this can be 'iTunes' or 'iCloud'
      },
      ...params,
    },
  };

  return await fetch("https://gsa.apple.com/grandslam/GsService2", {
    method: "POST",
    headers: {
      "Content-Type": "text/x-xml-plist",
      Accept: "*/*",
      "User-Agent": "akd/1.0 CFNetwork/978.0.7 Darwin/18.7.0",
      "X-MMe-Client-Info": anisette["X-MMe-Client-Info"],
    },
    body: TauriBody.text(buildPlist(body)),
    responseType: 2,
  });
};

export const authenticate = async (username, password) => {
  const anisette = await getAnisette(true);

  console.log(`generating A key`);

  const client = new srp.SRP(srp.G2048);
  await client.Setup(srp.Mode.Client, null, null);

  const A = await client.EphemeralPublic();

  let response = await authFetch(anisette, {
    A2k: Buffer.from(bigintToBase64(A), "base64"),
    ps: ["s2k", "s2k_fo"],
    u: username.toLowerCase(),
    o: "init",
  });

  let data = parsePlist(response.data)["Response"];
  console.log(data, response.ok);
  if (data["sp"] != "s2k") {
    showErrorToast(
      `There was an error authenticating you. Please report this (with log info).`
    );
    throw new Error(
      `Implementation only supports s2k. Server returned ${data["sp"]}`
    );
  }

  // convert salt from base64 to uint8array
  const saltBuffer = data["s"];
  const saltU8Array = new Uint8Array(saltBuffer.buffer);

  let encryptedPassword = await new Promise((r) =>
    pbkdf2(password, saltBuffer, data["i"], 32, "sha256", (err, k) => r(k))
  );

  // H(s | H( ":" | p))
  //buffer as string
  let cryptPassStr = new TextDecoder().decode(encryptedPassword);
  let passU8 = new TextEncoder().encode(`:${cryptPassStr}`);
  let passSum = await sumSHA256(passU8);

  let xSum = new Uint8Array(saltU8Array.length + passSum.length);
  xSum.set(saltU8Array);
  xSum.set(passSum, saltU8Array.length);

  console.log(await KDFSHA256(saltU8Array, username, cryptPassStr, false));
  console.log(await sumSHA256(xSum));

  client.setXorV(
    srp.Mode.Client,
    await KDFSHA256(saltU8Array, username, password, false)
  );

  client.SetOthersPublic(bufToBigint(data["B"]));
  const key = await client.Key();
  const M = await client.M(saltU8Array, username);
  console.log(M);

  const response2 = await authFetch(anisette, {
    c: data["c"],
    M1: M,
    u: username.toLowerCase(),
    o: "complete",
  });

  console.log(response2);

  const data2 = parsePlist(response2.data)["Response"];
  console.log(data2);
};
