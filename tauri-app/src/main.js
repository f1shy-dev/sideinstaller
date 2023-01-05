const { invoke } = window.__TAURI__.tauri;
const { fetch } = window.__TAURI__.http;
import srp from "@elliotcourant/srp.js";
// const response = await fetch("http://localhost:3003/users/2", {
//   method: "GET",
//   timeout: 30,
// });

const log = (msg) => {
  const logEl = document.querySelector("#log-window");
  logEl.innerHTML += `[${new Date().toISOString().slice(11, 19)}] ${msg}<br />`;
};

const template = (html, obj) => {
  Object.keys(obj).forEach(
    (key) => (html = html.replace(new RegExp(`{{${key}}}`, "g"), obj[key]))
  );
  return html;
};

let deviceItem = `        <div
          id="device-card"
          udid="{{udid}}"
          class="bg-[#0f0f0f] text-white px-3 py-2 rounded-lg w-full flex flex-col"
        >
          <span class="text-sm">{{name}}</span
          ><span class="text-gray-400 text-xs font-mono">UDID: {{udid}}</span>
          <span class="text-xs mt-2">Actions</span>
          <div class="flex">
            <button
              id="pairing"
              type="button"
              class="bg-neutral-700 text-white px-2 py-1 rounded-lg text-xs mt-1"
            >
              Generate Pairing File
            </button>
          </div>
        </div>`;

(async () => {
  document.querySelector("#get-devices").addEventListener("click", async () => {
    let deviceInvoke = await invoke("get_devices");
    if (!deviceInvoke.startsWith("{")) return log(deviceInvoke);
    let devices = JSON.parse(JSON.parse(deviceInvoke)) || [];
    log(JSON.stringify(devices, null, 2));
    document.querySelector("#device-list").innerHTML = devices
      .map((device) =>
        template(deviceItem, {
          ...device,
          name: `${device.name}${device.network ? " (Network)" : " (USB)"}`,
        })
      )
      .join("");

    // loop over cards, get udid attribute and assign listener to button(s)
    document.querySelectorAll("#device-card").forEach((card) => {
      card.querySelector(`#pairing`).addEventListener("click", async () => {
        log(`Generating pairing file for ${card.getAttribute("udid")}`);

        log(
          await invoke("export_pairing_file", {
            udid: card.getAttribute("udid"),
          })
        );
      });
    });
  });
  document
    .querySelector(`#get-anisette-mac`)
    .addEventListener("click", async () => {
      log(`Getting anisette data using AOSKit`);

      log(await invoke("get_anisette_macos"));
    });
  document.querySelector("#clear-log").addEventListener("click", async () => {
    document.querySelector(
      "#log-window"
    ).innerHTML = `<span class="font-medium text-sm">Log Window</span><br />`;
  });

  document
    .querySelector("#authenticate")
    .addEventListener("click", async () => {
      log(`Authenticating with Apple`);

      const salt = new Uint8Array([123, 235, 5, 4, 65, 97, 43, 100]);
      const username = "email@test.com";
      let password = "superSecureP@ssw0rd";
      log(
        `generating salt with *****@${
          username.split("@")[1]
        } and password ${"*".repeat(password.length)}`
      );

      const x = await srp.KDFSHA512(salt, username);
      log(`kdfsha512: ${x}`);
      const client = new srp.SRP(srp.G4096);
      await client.Setup(srp.Mode.Client, x, null);

      const A = await client.EphemeralPublic();
      log(`client public key A: ${A}`);
      // log(await invoke("authenticate"));
    });
})();
