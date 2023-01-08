import srp from "@f1shy-dev/srp.js";
import { getAnisette } from "./anisette";
import { build as buildPlist, parse as parsePlist } from "plist";
import { bigintToBase64, bigintToBuf, bufToBigint } from "bigint-conversion";
import { pbkdf2 } from "pbkdf2";
import { KDFSHA256, sumSHA256 } from "@f1shy-dev/srp.js/src/kdf";
import { showErrorToast } from "./helpers";
import crypto from "crypto";
const { fetch, Body: TauriBody } = window.__TAURI__.http;
import srpJS from "@getinsomnia/srp-js";
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
  const _ = null;

  console.log(`generating A key`);

  const params = srpJS.params["2048"];
  const secret1 = await new Promise((r) => srpJS.genKey((e, k) => r(k)));

  var c = new srpJS.Client(params, _, _, _, secret1);
  var srpA = c.computeA();

  let response = await authFetch(anisette, {
    A2k: srpA,
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
  console.log(saltBuffer);
  let passwordHash = crypto.createHash(params.hash).update(password).digest();
  let encryptedPassword = await new Promise((r) =>
    pbkdf2(passwordHash, saltBuffer, data["i"], 32, "sha256", (err, k) => r(k))
  );
  console.log(encryptedPassword);

  console.log(`setting X`);
  //str to buffer
  const usernameBuf = Buffer.from(username.toLowerCase(), "utf8");
  c.setX(params, saltBuffer, usernameBuf, encryptedPassword);

  console.log(`setting B`);
  console.log(data["B"]);
  c.setB(data["B"]);

  const M = c.computeAppleM1();
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
