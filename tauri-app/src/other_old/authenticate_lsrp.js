import { getAnisette } from "../scripts/anisette";
import { build as buildPlist, parse as parsePlist } from "plist";
import { bigintToBase64, bigintToBuf, bufToBigint } from "bigint-conversion";
import { pbkdf2 } from "pbkdf2";
import { showErrorToast } from "../scripts/helpers";
import crypto from "crypto";
const { fetch, Body: TauriBody } = window.__TAURI__.http;
import { Client, params as srpParams } from "../scripts/srp/srp.js";

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

  const params = srpParams[2048];
  console.log(params);
  const secret1 = await new Promise((r) =>
    crypto.randomBytes(32, (err, buf) => r(buf.buffer))
  );

  //buf to uint8array

  var c = new Client(params, new Uint8Array(secret1));
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

  const salt = data["s"];
  c.computeX(password, salt, data["i"]);
  c.setB(data["B"], username.toLowerCase(), salt);

  const M = c.computeM1();
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
