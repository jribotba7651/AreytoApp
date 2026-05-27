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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub editor_view_mode: Option<String>,
    #[serde(default = "default_version")]
    pub version: u32,
    #[serde(default = "default_auto_commit")]
    pub auto_commit: bool,
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

fn default_auto_commit() -> bool {
    true
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
    match serde_json::from_str(&content) {
        Ok(s) => Ok(s),
        Err(e) => {
            eprintln!("[areyto] settings.json parse warning: {}. Using defaults.", e);
            Ok(GlobalSettings { version: 1, ..Default::default() })
        }
    }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_auto_commit_es_true_al_deserializar() {
        // Cuando auto_commit falta en el JSON (archivo de versión anterior), serde usa el default (true)
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert!(s.auto_commit, "auto_commit debe ser true cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_auto_commit_false() {
        let original = GlobalSettings {
            version: 1,
            auto_commit: false,
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert!(!parsed.auto_commit, "auto_commit false debe preservarse en roundtrip");
    }

    #[test]
    fn json_corrupto_retorna_error_de_serde() {
        let result: Result<GlobalSettings, _> = serde_json::from_str("{ corrupto json !!!}");
        assert!(result.is_err(), "JSON corrupto debe retornar error de deserialización");
    }
}
