const { invoke } = window.__TAURI__.tauri;

const getDevices = async () => {
    let deviceInvoke = await invoke("get_devices");
    if (!deviceInvoke.startsWith("{")) throw new Error(deviceInvoke);

    let devices = JSON.parse(JSON.parse(deviceInvoke)) || [];
    console.log(JSON.stringify(devices, null, 2));
    return devices;
};

export { getDevices };