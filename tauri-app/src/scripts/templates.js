let deviceCard = `        
<div
    id="device-card"
    udid="{{udid}}"
    class="bg-[#0f0f0f] text-white px-3 py-2 rounded-lg w-full flex flex-col"
>
    <span class="text-sm">{{name}}</span
    ><span class="text-gray-400 text-xs font-mono">UDID: {{udid}}</span>
    <span class="text-xs mt-2">Actions</span>
    <div class="flex">
    <button
        id="pairing"
        type="button"
        class="bg-neutral-700 text-white px-2 py-1 rounded-lg text-xs mt-1"
    >
        Generate Pairing File
    </button>
    </div>
</div>`;

export { deviceCard };