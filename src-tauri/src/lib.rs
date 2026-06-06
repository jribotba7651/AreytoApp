mod export;
mod git;
mod project_fs;
mod settings;
mod terminal;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(std::sync::Mutex::new(None::<terminal::PtySession>))
        .menu(|app| {
            let app_menu = Submenu::with_items(
                app,
                "Areyto",
                true,
                &[
                    &PredefinedMenuItem::about(app, None, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::quit(app, None)?,
                ],
            )?;
            let file_menu = Submenu::with_items(
                app,
                "File",
                true,
                &[
                    &MenuItem::with_id(app, "open-project", "Open Project\u{2026}", true, Some("CmdOrCtrl+O"))?,
                    &MenuItem::with_id(app, "new-project", "New Project\u{2026}", true, Some("CmdOrCtrl+Shift+N"))?,
                    &PredefinedMenuItem::separator(app)?,
                    &MenuItem::with_id(app, "close-project", "Close Project", true, Some("CmdOrCtrl+Shift+W"))?,
                ],
            )?;
            Menu::with_items(app, &[&app_menu, &file_menu])
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open-project" => { app.emit("menu:open-project", ()).ok(); }
            "new-project"  => { app.emit("menu:new-project", ()).ok(); }
            "close-project" => { app.emit("menu:close-project", ()).ok(); }
            _ => {}
        })
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
            git::git_tag,
            git::git_tag_exists,
            git::git_list_tags_matching,
            git::git_tag_info,
            git::git_list_chapter_tags,
            git::git_commit_all,
            export::export_book_markdown,
            export::export_book_docx,
            settings::read_global_settings,
            settings::write_global_settings,
            settings::read_project_state,
            settings::write_project_state,
            terminal::pty_spawn,
            terminal::pty_write,
            terminal::pty_resize,
            terminal::pty_kill,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
