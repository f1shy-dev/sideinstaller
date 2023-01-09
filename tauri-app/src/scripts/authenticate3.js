import { getAnisette } from "./anisette";
import { build as buildPlist, parse as parsePlist } from "plist";
import { bigintToBase64, bigintToBuf, bufToBigint } from "bigint-conversion";
import { pbkdf2 } from "pbkdf2";
import { showErrorToast } from "./helpers";
import crypto from "crypto";
const { fetch, Body: TauriBody } = window.__TAURI__.http;

import srp from "secure-remote-password/client";
window.deriveKey = async (saltB64, un, pass, iterations) => {
  let salt = Buffer.from(saltB64, "base64");
  const passHash = crypto.createHash("sha256").update(pass).digest();
  const cryptPass = await new Promise((resolve, reject) => {
    pbkdf2(passHash, salt, iterations, 32, "sha256", (err, key) => {
      if (err) reject(err);
      resolve(key);
    });
  });
  const privateKey = srp.derivePrivateKey(salt.toString("hex"), "", cryptPass);
  console.log(`passHash`, passHash);
  console.log(`cryptPass`, cryptPass);
  console.log(`cryptPass b64`, cryptPass.toString("base64"));
  console.log(`x key`, privateKey);
  console.log(`x key b64`, Buffer.from(privateKey, "hex").toString("base64"));
  console.log(`x key bigint`, BigInt(parseInt(privateKey, 16)).toString());

  return privateKey;
};

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

const checkError = (data) => {
  data["Status"] && (data = data["Status"]);
  if (data["ec"] !== 0)
    return { err: true, msg: `Error: ${data["ec"]}: ${data["em"]}` };
  return { err: false };
};

export const authenticate = async (username, password) => {
  const anisette = await getAnisette(true);
  const _ = null;

  console.log(`generating A key`);

  //buf to uint8array
  console.log(Buffer.from(""));

  const srpA = srp.generateEphemeral();

  let response = await authFetch(anisette, {
    A2k: Buffer.from(srpA.public, "hex"),
    ps: ["s2k", "s2k_fo"],
    u: username.toLowerCase(),
    o: "init",
  });

  let data = parsePlist(response.data)["Response"];
  console.log(data, response.ok);

  let hasErr = checkError(data);
  if (hasErr.err) {
    showErrorToast(hasErr.msg);
    console.error(hasErr.msg);
    return { success: false };
  }

  if (data["sp"] != "s2k") {
    showErrorToast(
      `There was an error authenticating you. Please report this (with log info).`
    );
    throw new Error(
      `Implementation only supports s2k. Server returned ${data["sp"]}`
    );
  }

  const salt = data["s"];
  console.log("salt", salt.toString("base64"));

  const passHash = crypto.createHash("sha256").update(password).digest();
  const encryptedPass = await new Promise((resolve, reject) => {
    pbkdf2(passHash, salt, data["i"], 32, "sha256", (err, key) => {
      if (err) reject(err);
      resolve(key);
    });
  });

  const privateKey = srp.derivePrivateKey(
    salt.toString("hex"),
    "",
    encryptedPass
  );

  const clientSession = srp.deriveSession(
    srpA.secret,
    data["B"].toString("hex"),
    salt.toString("hex"),
    username.toLowerCase(),
    privateKey
  );

  console.log("sha256(pass)", passHash);
  console.log("pbkdf2(pass, salt, data[i], 32, sha256)", encryptedPass);
  console.log(
    "pbkdf2(pass, salt, data[i], 32, sha256)",
    encryptedPass.toString("base64")
  );

  console.log("x key", Buffer.from(privateKey, "hex").toString("base64"));
  console.log("M1 proof", clientSession.proof);
  console.log(BigInt(parseInt(privateKey, 16)).toString());

  const response2 = await authFetch(anisette, {
    c: data["c"],
    M1: Buffer.from(clientSession.proof, "hex"),
    u: username.toLowerCase(),
    o: "complete",
  });

  console.log(response2);

  const data2 = parsePlist(response2.data)["Response"];
  console.log(JSON.stringify(data2["Status"], null, 2));
  let hasErr2 = checkError(data2);
  if (hasErr2.err) {
    showErrorToast(hasErr2.msg);
    console.error(hasErr2.msg);
    return { success: false };
  }

  return { success: true };
};
