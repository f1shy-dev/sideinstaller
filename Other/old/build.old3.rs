extern crate cc;
use std::process::Command;

extern crate gcc;

fn main() {

    let output = Command::new("xcrun")
        .arg("--show-sdk-path")
        .output()
        .expect("failed to execute process");
    let xcsdkpath = String::from_utf8_lossy(&output.stdout).trim().to_string();

    
    println!(
        "cargo:rustc-link-search=framework={}",
        "/System/Library/PrivateFrameworks"
    );
    println!(
        "cargo:rustc-link-search=framework={}",
        format!("{}/System/Library/PrivateFrameworks", xcsdkpath)
    );
    println!(
        "cargo:rustc-link-search=framework={}",
        "./src/"
    ); 

    //xcrun clang -x objective-c -target x86_64-apple-macos10.14 -fobjc-arc -fobjc-weak -fmodules -gmodules -isysroot `xcrun --show-sdk-path` -c ./AOSKit/main.m -o ./build/AOSKit.build/Release/AOSKit.build/Objects-normal/x86_64/main.o


    
    cc::Build::new()
    .compiler("/Applications/Xcode-14.1.0.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang")
    .flag("-isysroot").flag("/Applications/Xcode-14.1.0.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk")
    
    .flag("-x").flag("objective-c")
    .flag("-fmodules")
    .flag("-gmodules")
    .flag("-fobjc-arc")
    .flag("-fobjc-weak")
    
    // .flag("src/AOSKit.tbd")
    .file("src/sample.m")
    .compile("libsample.a");
}
