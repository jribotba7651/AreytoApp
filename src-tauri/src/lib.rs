mod git;
mod project_fs;
mod terminal;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(std::sync::Mutex::new(None::<terminal::PtySession>))
        .invoke_handler(tauri::generate_handler![
            greet,
            project_fs::read_text_file,
            project_fs::write_text_file,
            project_fs::path_exists,
            project_fs::ensure_dir,
            project_fs::list_dir,
            project_fs::rename_path,
            git::git_repo_exists,
            git::git_init,
            git::git_initial_commit,
            git::git_has_changes,
            git::git_commit_file,
            git::git_log_file,
            git::git_show_file_at_commit,
            terminal::pty_spawn,
            terminal::pty_write,
            terminal::pty_resize,
            terminal::pty_kill,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
