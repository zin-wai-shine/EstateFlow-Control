use std::process::Command;
use std::path::PathBuf;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn open_native_chrome(profile_dir: String, url: Option<String>) -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let mut data_dir = PathBuf::from(home);
    data_dir.push("Library");
    data_dir.push("Application Support");
    data_dir.push("EstateFlow");
    data_dir.push("Browsers");
    data_dir.push(&profile_dir);

    let _ = std::fs::create_dir_all(&data_dir);
    let target_url = url.unwrap_or_else(|| "https://chatgpt.com".to_string());

    #[cfg(target_os = "macos")]
    {
        let res = Command::new("/usr/bin/open")
            .arg("-na")
            .arg("Google Chrome")
            .arg("--args")
            .arg(format!("--user-data-dir={}", data_dir.display()))
            .arg(&target_url)
            .spawn();

        match res {
            Ok(_) => Ok(format!("Opened Chrome profile at {} with {}", data_dir.display(), target_url)),
            Err(e) => Err(format!("Failed to launch Google Chrome: {}", e)),
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        Ok(format!("Chrome launch not supported on this OS"))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, open_native_chrome])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
