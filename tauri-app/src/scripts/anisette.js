const { invoke } = window.__TAURI__.tauri;
const { platform } = window.__TAURI__.os;
const { fetch } = window.__TAURI__.http;

const getLocalAnisette = async () => {
  if ((await platform()) !== "darwin") return {};
  console.log("Fetching anisette from local device (AOSKit)...");
  return await invoke("get_anisette_macos");
};

const getRemoteAnisette = async () => {
  console.log("Fetching anisette from remote server...");
  const anisette = await fetch("https://ani.f1sh.me");
  console.log(anisette);
  if (!anisette.ok) return {};
  return anisette.data;
};

export const getAnisette = async (useXcode) => {
  const xcode = useXcode || false;
  console.log(await platform());
  anisette =
    (await platform()) === "darwin"
      ? await getLocalAnisette()
      : await getRemoteAnisette();
  if (!anisette) return;
  console.log(anisette);
  anisette = typeof anisette === "string" ? JSON.parse(anisette) : anisette;

  anisette = {
    ...anisette,
    loc: anisette["X-Apple-Locale"],
    "X-Apple-RINFO": "17106176",
    "X-MMe-Client-Info": xcode
      ? anisette["X-MMe-Client-Info"].replace(
          /^([^<]*<[^<>]+>\s*)([^<]*<[^<>]+>\s*)(<[^<>]+>)/,
          "$1$2<com.apple.AuthKit/1 (com.apple.dt.Xcode/3594.4.19)>"
        )
      : anisette["X-MMe-Client-Info"],
  };

  console.log(`got anisette:`, anisette);
  return anisette;
};
