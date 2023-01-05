import { ArrayStore } from "./scripts/state.js";
import { onClick } from "./scripts/helpers.js";
import { anisetteFetch, startDeviceFetch } from "./scripts/background.js";
import { authenticate } from "./scripts/authenticate.js";
import { getAnisette } from "./scripts/anisette.js";
import { initWizard } from "./scripts/wizard.js";
window.DeviceStore = ArrayStore();

(async () => {
  initWizard();
  // onClick("#get-devices", startDeviceFetch);
  onClick("#get-anisette", getAnisette);
  onClick("#authenticate", authenticate);
})();
