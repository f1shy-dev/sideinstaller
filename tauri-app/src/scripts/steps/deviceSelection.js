import { getDevices } from "../device";
import { template } from "../helpers";
import { deviceCard } from "../templates";



const fetchDevicesAndPaginate = async (container) => {
    let list = container.querySelector("#device-list");
    let devices = await getDevices();
    if (devices.length === 0) {
        list.innerHTML = `<p class="text-center text-gray-300 mt-4">No devices found, try refreshing...</div>`;
        return;
    }
    let elements = devices.map((device) =>
        template(deviceCard, {
            ...device,
            name: `${device.name}${device.network ? " (Network)" : " (USB)"}`,
        }, {
            "#pairing-file": (e) => {
                console.log(`Generating pairing file for ${e.target.parentElement.parentElement.getAttribute("udid")}`);
            }
        }));
    list.innerHTML = "";
    elements.forEach((e) => list.appendChild(e));
};

const step = {
    container: "#device-selection",
    onstart: [
        async (contID) => {
            let container = document.querySelector(contID);
            fetchDevicesAndPaginate(container)
            container.querySelector("#refresh-devices").addEventListener("click", () => fetchDevicesAndPaginate(container));
        }
    ],
    next: "anisette"
};

export default step;