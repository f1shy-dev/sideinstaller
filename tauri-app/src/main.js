import { onClick } from "./scripts/helpers.js";
import { authenticate } from "./scripts/authenticate.js";
import { getAnisette } from "./scripts/anisette.js";
import { initWizard } from "./scripts/wizard.js";
import { getDevices } from "./scripts/device.js";

(async () => {
  initWizard();
  onClick("#debug-button", () => {
    document.querySelector("#debug-buttons-section").classList.toggle("hidden");
  });
  onClick("#get-devices", async () => {
    console.log(await getDevices());
  });
  onClick("#get-anisette", getAnisette);
  onClick("#authenticate", authenticate);
})();
