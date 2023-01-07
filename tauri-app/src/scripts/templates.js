let deviceCard = `        
<div id="device-card" udid="{{udid}}" class="bg-[#0f0f0f] text-white px-3 py-2 rounded-lg w-full flex">
    <div class="flex flex-col">
        <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" id="icon-usb" hidden>
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path
                    fill="#fff"
                    d="M18 7h-2c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1v2h-3V5h1c.41 0 .65-.47.4-.8l-2-2.67c-.2-.27-.6-.27-.8 0l-2 2.67c-.25.33-.01.8.4.8h1v8H8v-2.07c.83-.44 1.38-1.36 1.14-2.43-.17-.77-.77-1.4-1.52-1.61C6.15 6.48 4.8 7.59 4.8 9c0 .85.5 1.56 1.2 1.93V13c0 1.1.9 2 2 2h3v3.05c-.86.45-1.39 1.42-1.13 2.49.18.75.79 1.38 1.54 1.58 1.46.39 2.8-.7 2.8-2.12 0-.85-.49-1.58-1.2-1.95V15h3c1.1 0 2-.9 2-2v-2c.55 0 1-.45 1-1V8C19 7.45 18.55 7 18 7z"
                />
            </svg>

            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" id="icon-network" hidden>
                <path d="M0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none" />
                <path
                    fill="#fff"
                    d="M2.06 10.06c.51.51 1.32.56 1.87.1 4.67-3.84 11.45-3.84 16.13-.01.56.46 1.38.42 1.89-.09.59-.59.55-1.57-.1-2.1-5.71-4.67-13.97-4.67-19.69 0-.65.52-.7 1.5-.1 2.1zm7.76 7.76l1.47 1.47c.39.39 1.02.39 1.41 0l1.47-1.47c.47-.47.37-1.28-.23-1.59-1.22-.63-2.68-.63-3.91 0-.57.31-.68 1.12-.21 1.59zm-3.73-3.73c.49.49 1.26.54 1.83.13 2.44-1.73 5.72-1.73 8.16 0 .57.4 1.34.36 1.83-.13l.01-.01c.6-.6.56-1.62-.13-2.11-3.44-2.49-8.13-2.49-11.58 0-.69.5-.73 1.51-.12 2.12z"
                />
            </svg>

            <div class="flex flex-col ml-2">
                <span class="text-sm">{{name}}</span>
                <span class="text-gray-400 text-xs font-mono">UDID: {{udid}}</span>
            </div>
        </div>
        <div class="flex gap-2">
            <button id="pairing-file" type="button" class="bg-neutral-700 text-white px-2 py-1 rounded-lg text-xs mt-1">
                Generate Pairing File
            </button>
            <button id="install-app" type="button" class="bg-neutral-700 text-white px-2 py-1 rounded-lg text-xs mt-1">
                Install App
            </button>
        </div>
    </div>
</div>
`;

const toastCard = `
<div id="toast-{{uniqueid}}" class="pr-4 transform transition ease-in-out duration-400 translate-x-full">
    <div class="bg-red-500 text-white rounded-lg px-4 py-3 shadow-lg text-sm max-w-xs" id="toast-text">{{msg}}</div>
</div>
`;

export { deviceCard, toastCard };
