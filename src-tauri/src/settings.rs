use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PanelSizes {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sidebar: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub editor: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub terminal: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub versions: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GlobalSettings {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_project_path: Option<String>,
    #[serde(default)]
    pub panels: PanelSizes,
    #[serde(default = "default_version")]
    pub version: u32,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProjectState {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_active_chapter_path: Option<String>,
    #[serde(default = "default_version")]
    pub version: u32,
}

fn default_version() -> u32 {
    1
}

fn global_settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create app data dir: {}", e))?;
    Ok(dir.join("settings.json"))
}

#[tauri::command]
pub fn read_global_settings(app: tauri::AppHandle) -> Result<GlobalSettings, String> {
    let path = global_settings_path(&app)?;
    if !path.exists() {
        return Ok(GlobalSettings {
            version: 1,
            ..Default::default()
        });
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("Read failed: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Parse failed: {}", e))
}

#[tauri::command]
pub fn write_global_settings(
    app: tauri::AppHandle,
    settings: GlobalSettings,
) -> Result<(), String> {
    let path = global_settings_path(&app)?;
    let content =
        serde_json::to_string_pretty(&settings).map_err(|e| format!("Serialize failed: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Write failed: {}", e))
}

#[tauri::command]
pub fn read_project_state(project_path: String) -> Result<ProjectState, String> {
    let path = PathBuf::from(&project_path)
        .join(".areyto")
        .join("state.json");
    if !path.exists() {
        return Ok(ProjectState {
            version: 1,
            ..Default::default()
        });
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("Read failed: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Parse failed: {}", e))
}

#[tauri::command]
pub fn write_project_state(
    project_path: String,
    state: ProjectState,
) -> Result<(), String> {
    let dir = PathBuf::from(&project_path).join(".areyto");
    fs::create_dir_all(&dir).map_err(|e| format!("Create dir failed: {}", e))?;

    let path = dir.join("state.json");
    let content =
        serde_json::to_string_pretty(&state).map_err(|e| format!("Serialize failed: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Write failed: {}", e))?;

    let gitignore_path = PathBuf::from(&project_path).join(".gitignore");
    let existing = if gitignore_path.exists() {
        fs::read_to_string(&gitignore_path).unwrap_or_default()
    } else {
        String::new()
    };

    if !existing.contains(".areyto") {
        let updated = if existing.is_empty() {
            ".areyto/\n".to_string()
        } else if existing.ends_with('\n') {
            format!("{}.areyto/\n", existing)
        } else {
            format!("{}\n.areyto/\n", existing)
        };
        fs::write(&gitignore_path, updated)
            .map_err(|e| format!("Gitignore write failed: {}", e))?;
    }

    Ok(())
}
