use std::path::Path;
use std::sync::Mutex;
use notify::{Event, EventKind, RecursiveMode, Watcher};
use tauri::{AppHandle, Emitter, State};

pub struct WatcherState(pub Mutex<Option<notify::RecommendedWatcher>>);

#[tauri::command]
pub fn watch_project(
    app: AppHandle,
    state: State<'_, WatcherState>,
    path: String,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;

    // Drop previous watcher if any
    *guard = None;

    let capitulos = Path::new(&path).join("capitulos");
    let terminados = Path::new(&path).join("capitulos-terminados");

    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            match event.kind {
                EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                    let paths: Vec<String> = event
                        .paths
                        .iter()
                        .filter_map(|p| p.to_str().map(|s| s.to_string()))
                        .collect();
                    if !paths.is_empty() {
                        let _ = app.emit("project-files-changed", paths);
                    }
                }
                _ => {}
            }
        }
    })
    .map_err(|e| e.to_string())?;

    if capitulos.exists() {
        watcher
            .watch(&capitulos, RecursiveMode::NonRecursive)
            .map_err(|e| e.to_string())?;
    }
    if terminados.exists() {
        watcher
            .watch(&terminados, RecursiveMode::NonRecursive)
            .map_err(|e| e.to_string())?;
    }

    *guard = Some(watcher);
    Ok(())
}

#[tauri::command]
pub fn unwatch_project(state: State<'_, WatcherState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}
