extern crate cc;
use std::process::Command;

#[cfg(target_os = "macos")]
fn main() {
    let output = Command::new("xcrun")
        .arg("--show-sdk-path")
        .output()
        .expect("install xcode sdk and try again, or there was an error running xcrun");
    let xcsdkpath = String::from_utf8_lossy(&output.stdout).trim().to_string();

    println!(
        "cargo:rustc-link-search=framework={}",
        "/System/Library/PrivateFrameworks"
    );
    println!(
        "cargo:rustc-link-search=framework={}",
        format!("{}/System/Library/PrivateFrameworks", xcsdkpath)
    );
    println!("cargo:rustc-link-search=framework={}", "./src/");

    println!("cargo:rustc-link-lib=framework=Foundation");
    println!("cargo:rustc-link-lib=framework=AOSKit");
    println!("cargo:rustc-link-lib=framework=AuthKit");

    println!("cargo:rerun-if-changed=src/aoshelper.m");
    cc::Build::new()
        .file("src/aoshelper.m")
        .flag("-fmodules")
        .compile("libaoshelper.a");
}

#[cfg(not(target_os = "macos"))]
fn main() {
    // dont build
}
