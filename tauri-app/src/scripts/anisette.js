const { invoke } = window.__TAURI__.tauri;
const { platform } = window.__TAURI__.os;
const { fetch } = window.__TAURI__.http;


const getLocalAnisette = async () => {
    if (await platform() !== "darwin") return {};
    console.log("Fetching anisette from local device (AOSKit)...")
    return await invoke("get_anisette_macos");
};

const getRemoteAnisette = async () => {
    console.log("Fetching anisette from remote server...")
    const anisette = await fetch("https://ani.f1sh.me");
    if (!anisette.ok) return {};
    return anisette.data;
};

export const getAnisette = async () => {
    const anisette = ((await platform()) == "darwin") ? await getLocalAnisette() : await getRemoteAnisette();
    if (!anisette) return;
    console.log(`Got anisette: ${JSON.stringify(anisette, null, 2)}`);
    return anisette;
}
