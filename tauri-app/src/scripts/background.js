// fetch devices actively and every 5 seconds until we get a device then every 10/15
/*
import { getDevices } from "./device.js";

let timeout;

export const startDeviceFetch = async () => {
    console.log(
        `Fetching devices...`
    );
    getDevices().then((devices) => {
        if (devices.length > 0) {
            window.DeviceStore.set(devices);
            clearInterval(timeout);
            timeout = setInterval(() => {
                startDeviceFetch();
            }, 20000);
        } else {
            timeout = setInterval(() => {
                startDeviceFetch();
            }, 10000);
        }
    }).catch((err) => {
        clearInterval(timeout);
        console.log(`Error fetching devices, press reload to try again: ${err}`);
    });
};

*/