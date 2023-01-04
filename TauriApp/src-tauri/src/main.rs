#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use anisette_kit::base::anisette_data;
use rusty_libimobiledevice::{
    idevice::{self, Device},
    services::userpref,
};
use serde_json::{json, Result, Value};
use std::process::Command;

// get device name
#[tauri::command]
fn get_devices() -> String {
    let devices = match idevice::get_devices() {
        Ok(devices) => devices,
        Err(e) => {
            // If the daemon is not running or does not behave as expected, this returns an error
            return format!("Error getting devices: {:?}", e);
        }
    };
    //array of deviceinfo objects
    let mut mp = Vec::new();
    for device in devices {
        let lock_cli = match device.new_lockdownd_client("ss_downloader") {
            Ok(l) => l,
            Err(_) => continue,
        };
        let name = match lock_cli.get_device_name() {
            Ok(n) => n,
            Err(_) => continue,
        };
        // put it into a json of a device info with serde_json
        let devval = json!({
            "name": name,
            "network": device.get_network(),
            "version": device.get_version(),
            "udid": device.get_udid(),
        });
        mp.push(devval);
    }

    return format!("{:?}", json!(mp).to_string());
}

#[tauri::command]
fn export_pairing_file(udid: String) -> String {
    return match userpref::read_pair_record(udid.clone()) {
        Ok(p) => p,
        Err(e) => {
            return format!("Failed to get pairing file: {:?}", e);
        }
    }
    .to_string();
}

#[tauri::command]
fn get_anisette_macos(handle: tauri::AppHandle) -> String {
    return anisette_data();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_devices,
            export_pairing_file,
            get_anisette_macos
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
