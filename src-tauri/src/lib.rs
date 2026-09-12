mod export;
mod git;
mod import;
mod project_fs;
mod settings;
mod terminal;
mod watcher;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter,
};

fn detect_system_lang() -> &'static str {
    for var in ["LANG", "LC_ALL", "LC_MESSAGES"] {
        if let Ok(val) = std::env::var(var) {
            if val.starts_with("es") {
                return "es";
            }
        }
    }
    "en"
}

struct MenuLabels {
    file: &'static str,
    open_project: &'static str,
    new_project: &'static str,
    close_project: &'static str,
}

fn menu_labels(lang: &str) -> MenuLabels {
    match lang {
        "es" => MenuLabels {
            file: "Archivo",
            open_project: "Abrir proyecto\u{2026}",
            new_project: "Nuevo proyecto\u{2026}",
            close_project: "Cerrar proyecto",
        },
        _ => MenuLabels {
            file: "File",
            open_project: "Open Project\u{2026}",
            new_project: "New Project\u{2026}",
            close_project: "Close Project",
        },
    }
}

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
        .manage(watcher::WatcherState::new())
        .menu(|app| {
            let labels = menu_labels(detect_system_lang());
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
                labels.file,
                true,
                &[
                    &MenuItem::with_id(app, "open-project", labels.open_project, true, Some("CmdOrCtrl+O"))?,
                    &MenuItem::with_id(app, "new-project", labels.new_project, true, Some("CmdOrCtrl+Shift+N"))?,
                    &PredefinedMenuItem::separator(app)?,
                    &MenuItem::with_id(app, "close-project", labels.close_project, true, Some("CmdOrCtrl+Shift+W"))?,
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
            project_fs::copy_file,
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
            export::export_book_epub,
            settings::read_global_settings,
            settings::write_global_settings,
            settings::read_project_state,
            settings::write_project_state,
            terminal::pty_spawn,
            terminal::pty_write,
            terminal::pty_resize,
            terminal::pty_kill,
            watcher::watch_project,
            watcher::unwatch_project,
            import::import_docx,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
