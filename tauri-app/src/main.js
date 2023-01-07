import { onClick } from "./scripts/helpers.js";
import { authenticate } from "./scripts/authenticate.js";
import { getAnisette } from "./scripts/anisette.js";
import { initWizard } from "./scripts/wizard.js";
import { getDevices } from "./scripts/device.js";
const { appWindow } = window.__TAURI__.window;

(async () => {
  document
    .getElementById("titlebar-minimize")
    .addEventListener("click", () => appWindow.minimize());

  const noDragSelector = "input, a, button"; // CSS selector
  document
    .querySelector(".drag-region")
    .addEventListener("mousedown", async (e) => {
      if (e.target.closest(noDragSelector)) return; // a non-draggable element either in target or its ancestors
      await appWindow.startDragging();
    });

  document
    .getElementById("titlebar-close")
    .addEventListener("click", () => appWindow.close());

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
