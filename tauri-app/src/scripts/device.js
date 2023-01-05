const { invoke } = window.__TAURI__.tauri;

const getDevices = async () => {
    let deviceInvoke = await invoke("get_devices");
    try {
        let devices = JSON.parse(JSON.parse(deviceInvoke)) || [];
        console.log(JSON.stringify(devices, null, 2));
        return devices;
    }
    catch (e) {
        console.log("Error: " + e);
        return [];
    }
};

export { getDevices };