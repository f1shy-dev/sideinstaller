const { invoke } = window.__TAURI__.tauri;

let greetInputEl;
let greetMsgEl;

const log = (msg) => {
  const logEl = document.querySelector("#log-window");
  logEl.innerHTML += `${new Date().toLocaleTimeString()} ${msg}<br />`;
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
    let devices = JSON.parse(JSON.parse(await invoke("get_devices")));
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
})();
