import srp from "@f1shy-dev/srp.js";
import { getAnisette } from "./anisette";
import { build as buildPlist } from "plist";
import { bigintToBase64 } from "bigint-conversion";
import { pbkdf2 } from "pbkdf2";
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

  srp.KDFSHA256();

  let res = await authFetch(
    anisette,
    {
      A2k: Buffer.from(bigintToBase64(A), "base64"),
      ps: ["s2k", "s2k_fo"],
      u: username.toLowerCase(),
      o: "init",
    },
    "A2k"
  );

  //   pbkdf2(password, "salt", 1, 32, "sha256");
  console.log(res.data);
};
