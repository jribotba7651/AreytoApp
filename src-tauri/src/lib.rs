mod project_fs;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            project_fs::read_text_file,
            project_fs::write_text_file,
            project_fs::path_exists,
            project_fs::ensure_dir,
            project_fs::list_dir,
            project_fs::rename_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
