use std::env;
use std::path::Path;
extern crate bindgen;

fn main() {
    let target = std::env::var("TARGET").unwrap();

    let sdk_path = "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk";

    println!("cargo:rustc-link-search=framework=/System/Library/PrivateFrameworks");
    println!(
        "cargo:rustc-link-search=framework={}",
        format!("{}/System/Library/PrivateFrameworks", sdk_path)
    );

    println!("cargo:rustc-link-lib=framework=AOSKit");
    let builder = bindgen::Builder::default()
        .rustfmt_bindings(true)
        // found this online, edit it to reference a header file
        .header("src/aoskit.h")
        .clang_args(&[&format!("--target={}", target)])
        .clang_args(&["-isysroot", sdk_path])
        .block_extern_crate(true)
        .generate_block(true)
        .clang_args(&["-fblocks"])
        .objc_extern_crate(true)
        .clang_args(&["-x", "objective-c"]);

    // .blacklist_item("timezone")
    //      .blacklist_item("IUIStepper")
    //  .blacklist_function("dividerImageForLeftSegmentState_rightSegmentState_")
    //  .blacklist_item("objc_object");

    let bindings = builder.generate().expect("unable to generate bindings");

    let out_dir = env::var_os("OUT_DIR").unwrap();
    bindings
        .write_to_file(Path::new(&out_dir).join("aoskit.rs"))
        .expect("could not write bindings");
}
