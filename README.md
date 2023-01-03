## sideinstaller tauri idk work in progress

### background info on my linking attempts

Linking Demo folder and objc_rust and base in [LinkingAttempt](./AOSKit%20LinkingAttempt/) is based from some reddit answer and it's source at <https://github.com/maciej-irl/objc_rust.git>
(me trying to use that base to get linker to work??)

this is the working clang command below assuming main.m in the folder
`main.m` can be seen in the [AppleIDAuth Folder](./AppleIDAuth/AOSKit/)

- this produces working anisette data from authkit and aoskit
- logs it as json string, but ideally this json string should be returned
- [`aoskit.m`](./aoskit.m) theoretically contains the whole implementation and headers for getting anisette, but I have given up on linking it

working clang command from xcodebuild (ive tried to replicate this in the cc crate but no luck):

```bash
xcrun clang -O0 -ffunction-sections -fdata-sections -fPIC -g -x objective-c -target x86_64-apple-macos10.14 -fobjc-arc -fobjc-weak -fmodules -gmodules -isysroot `xcrun --show-sdk-path` -c ./AOSKit/main.m -o ./build/AOSKit.build/Release/AOSKit.build/Objects-normal/x86_64/main.o
```

### tauri project

- files are inside [Tauri Demo](./Tauri%20Demo/)
- dev with `yarn tauri dev`
- idk gets anisette data from a built binary there
- also uses rusty_libi to list devices in the UI

### to-do list (in some sort of order)

- link aoskit to tauri/rust so that no binaries have to be bundled
- get provision-rs done and implemented for windows/linux
- port riley's idfk code from <https://github.com/rileytestut/AltServer-Windows/blob/master/AltServer/AnisetteDataManager.cpp#L382> into rust or even JS
  - basically the api requests for logging in using grandslam2 and that auth thing
  - then also get the signing certs and whatever
- sign with zsign or ldid whatever works
- install with rusty_libimobiledevice
- gh actions to build and cache all this stuff

### more useful links (for me to remember?)

<https://github.com/vtky/AppleIDAuth/blob/master/AppleID%20Authentication.md>
<https://github.com/rileytestut/AltServer-Windows/>
