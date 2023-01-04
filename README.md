## sideinstaller tauri idk work in progress

### tauri project

- files are inside [TauriApp](./TauriApp/)
- dev with `yarn tauri dev`
- gets anisette data from crate `anisette-kit` (see below)
- also uses rusty_libi to list devices in the UI

### anisette-kit

- links to the macos private frameworks, will later also link to `provision-rs` or the `AOSKit.dll` on windows
- provides anisette data (macos only right now)
- very cool

### to-do list (in some sort of order)

- [x] link aoskit to tauri/rust so that no binaries have to be bundled
- [ ] get provision-rs done and implemented for windows/linux
- [ ] grandslam auth (in js??)
  - [ ] crypto library of some sort
  - [ ] authentication
  - [ ] getting teams/certs
- [ ] sign with zsign or ldid whatever works
- [ ] install with rusty_libimobiledevice
- [ ] gh actions to build and cache all this stuff

### more useful links (for me to remember?)

- <https://github.com/vtky/AppleIDAuth/blob/master/AppleID%20Authentication.md>
- <https://github.com/rileytestut/AltServer-Windows/>
- <https://github.com/JJTech0130/grandslam>
- <https://github.com/RustCrypto>
- "Secure remote password protocol"
