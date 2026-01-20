// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
use std::path::Path;
use std::io::Write;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Create a directory at the given path (bypasses Tauri's fs scope)
#[tauri::command]
fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))
}

/// Write content to a file at the given path (bypasses Tauri's fs scope)
#[tauri::command]
fn write_file_content(path: String, content: String) -> Result<(), String> {
    let mut file = fs::File::create(&path).map_err(|e| format!("Failed to create file: {}", e))?;
    file.write_all(content.as_bytes()).map_err(|e| format!("Failed to write file: {}", e))
}

/// Read file content from the given path (bypasses Tauri's fs scope)
#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Check if a path exists
#[tauri::command]
fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

/// Read directory contents
#[tauri::command]
fn read_directory(path: String) -> Result<Vec<(String, bool)>, String> {
    let entries = fs::read_dir(&path).map_err(|e| format!("Failed to read directory: {}", e))?;
    let mut results = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            let name = entry.file_name().to_string_lossy().to_string();
            let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
            results.push((name, is_dir));
        }
    }
    Ok(results)
}

/// Remove a file or directory
#[tauri::command]
fn remove_path(path: String, recursive: bool) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        if recursive {
            fs::remove_dir_all(&path).map_err(|e| format!("Failed to remove directory: {}", e))
        } else {
            fs::remove_dir(&path).map_err(|e| format!("Failed to remove directory: {}", e))
        }
    } else {
        fs::remove_file(&path).map_err(|e| format!("Failed to remove file: {}", e))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_directory,
            write_file_content,
            read_file_content,
            path_exists,
            read_directory,
            remove_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
