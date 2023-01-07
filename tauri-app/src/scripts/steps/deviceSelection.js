import { getDevices } from "../device";
import { template } from "../helpers";
import { deviceCard } from "../templates";

const fetchDevicesAndPaginate = async (container, retry, gap) => {
  let list = container.querySelector("#device-list");

  let devices = [];
  for (let i = 0; i < (retry || 1); i++) {
    devices = await getDevices();
    if (devices.length > 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, gap || 1000));
  }

  if (devices.length === 0) {
    list.innerHTML = `<p class="text-center text-gray-300 mt-4">No devices found, try refreshing...</div>`;
    document.querySelector("#refresh-indicator").style.display = "none";
    document.querySelector("#refresh-devices").style.display = "flex";
    return;
  }
  let elements = devices.map((device) => {
    let el = template(
      deviceCard,
      { ...device },
      {
        "#pairing-file": (e) => {
          console.log(
            `Generating pairing file for ${e.target.parentElement.parentElement.getAttribute(
              "udid"
            )}`
          );
        },
      },
      ["w-full"]
    );

    el.querySelector(
      `#icon-${device.network ? "network" : "usb"}`
    ).removeAttribute("hidden");
    return el;
  });
  list.innerHTML = "";
  elements.forEach((e) => list.appendChild(e));

  // for animation purposes
  await new Promise((resolve) => setTimeout(resolve, 500));
  document.querySelector("#refresh-indicator").style.display = "none";
  document.querySelector("#refresh-devices").style.display = "flex";
};

const step = {
  container: "#device-selection",
  onstart: [
    async (contID) => {
      let container = document.querySelector(contID);
      fetchDevicesAndPaginate(container, 15, 1000);
      container
        .querySelector("#refresh-devices")
        .addEventListener("click", () => {
          document.querySelector("#refresh-devices").style.display = "none";
          document.querySelector("#refresh-indicator").style.display = "flex";
          fetchDevicesAndPaginate(container, 5, 1000);
        });
    },
  ],
  next: "anisette",
};

export default step;
