import { ArrayStore } from "./scripts/state.js";
import { onClick } from "./scripts/helpers.js";
import { anisetteFetch, startDeviceFetch } from "./scripts/background.js";
import { authenticate } from "./scripts/authenticate.js";
import { getAnisette } from "./scripts/anisette.js";

window.DeviceStore = ArrayStore();


/*
  document.querySelector("#device-list").innerHTML = devices
    .map((device) =>
      template(deviceCard, {
        ...device,
        name: `${device.name}${device.network ? " (Network)" : " (USB)"}`,
      })
    )
    .join("");

  document.querySelectorAll("#device-card").forEach((card) => {
    card.querySelector(`#pairing`).addEventListener("click", async () => {
      console.log(`Generating pairing file for ${card.getAttribute("udid")}`);

      console.log(
        await invoke("export_pairing_file", {
          udid: card.getAttribute("udid"),
        })
      );
    });
  });
  */



(async () => {
  startDeviceFetch();
  onClick("#get-devices", startDeviceFetch);
  onClick("#get-anisette", getAnisette);
  onClick("#authenticate", authenticate);
})();
