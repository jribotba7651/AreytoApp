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
pub struct RecentProject {
    pub path: String,
    pub name: String,
    pub last_opened: String,
    pub chapter_count: u32,
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
    #[serde(default = "default_autosave_enabled")]
    pub autosave_enabled: bool,
    #[serde(default = "default_autosave_interval_ms")]
    pub autosave_interval_ms: u32,
    #[serde(default = "default_theme_mode")]
    pub theme_mode: String,
    #[serde(default = "default_editor_font_family")]
    pub editor_font_family: String,
    #[serde(default = "default_editor_font_size")]
    pub editor_font_size: u32,
    #[serde(default = "default_project_language")]
    pub default_project_language: String,
    #[serde(default = "default_book_font_family")]
    pub book_font_family: String,
    #[serde(default = "default_book_font_size")]
    pub book_font_size: u32,
    #[serde(default = "default_export_folder")]
    pub export_folder: String,
    #[serde(default = "default_ui_locale")]
    pub ui_locale: String,
    #[serde(default = "default_reading_goal_minutes")]
    pub reading_goal_minutes: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reading_seconds_by_day: Option<std::collections::HashMap<String, u32>>,
    #[serde(default)]
    pub writing_days: Vec<String>,
    #[serde(default)]
    pub recent_projects: Vec<RecentProject>,
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

fn default_autosave_enabled() -> bool {
    true
}

fn default_autosave_interval_ms() -> u32 {
    500
}

fn default_theme_mode() -> String {
    "light".to_string()
}

fn default_editor_font_family() -> String {
    "serif".to_string()
}

fn default_editor_font_size() -> u32 {
    16
}

fn default_project_language() -> String {
    "en".to_string()
}

fn default_book_font_family() -> String {
    "serif".to_string()
}

fn default_book_font_size() -> u32 {
    18
}

fn default_export_folder() -> String {
    String::new()
}

fn default_ui_locale() -> String {
    "en".to_string()
}

fn default_reading_goal_minutes() -> u32 {
    30
}

fn validate_settings(mut s: GlobalSettings) -> GlobalSettings {
    const MIN_MS: u32 = 500;
    const MAX_MS: u32 = 300_000;
    if s.autosave_interval_ms < MIN_MS || s.autosave_interval_ms > MAX_MS {
        eprintln!(
            "[areyto] autosave_interval_ms {} out of range [{}, {}], using default {}.",
            s.autosave_interval_ms, MIN_MS, MAX_MS, default_autosave_interval_ms()
        );
        s.autosave_interval_ms = default_autosave_interval_ms();
    }
    s
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
        Ok(s) => Ok(validate_settings(s)),
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

    #[test]
    fn json_de_f31_sin_autosave_interval_deserializa_con_default() {
        let json = r#"{"version": 1, "autoCommit": true, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert_eq!(s.autosave_interval_ms, 500, "autosave_interval_ms debe ser 500 cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_autosave_interval_ms_valido() {
        let original = GlobalSettings {
            version: 1,
            autosave_interval_ms: 5000,
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.autosave_interval_ms, 5000, "autosave_interval_ms 5000 debe preservarse en roundtrip");
    }

    #[test]
    fn default_theme_mode_es_light_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert_eq!(s.theme_mode, "light", "theme_mode debe ser 'light' cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_theme_mode_dark() {
        let original = GlobalSettings {
            version: 1,
            theme_mode: "dark".to_string(),
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.theme_mode, "dark", "theme_mode 'dark' debe preservarse en roundtrip");
    }

    #[test]
    fn roundtrip_theme_mode_auto() {
        let original = GlobalSettings {
            version: 1,
            theme_mode: "auto".to_string(),
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.theme_mode, "auto", "theme_mode 'auto' debe preservarse en roundtrip");
    }

    #[test]
    fn default_editor_font_family_es_serif_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert_eq!(s.editor_font_family, "serif", "editor_font_family debe ser 'serif' cuando falta en el JSON");
    }

    #[test]
    fn default_editor_font_size_es_16_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert_eq!(s.editor_font_size, 16, "editor_font_size debe ser 16 cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_editor_font_family_inter() {
        let original = GlobalSettings {
            version: 1,
            editor_font_family: "inter".to_string(),
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.editor_font_family, "inter");
    }

    #[test]
    fn roundtrip_editor_font_size_20() {
        let original = GlobalSettings {
            version: 1,
            editor_font_size: 20,
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.editor_font_size, 20);
    }

    #[test]
    fn default_project_language_es_en_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert_eq!(s.default_project_language, "en", "default_project_language debe ser 'en' cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_default_project_language_es() {
        let original = GlobalSettings {
            version: 1,
            default_project_language: "es".to_string(),
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.default_project_language, "es");
    }

    #[test]
    fn default_book_font_family_es_serif_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert_eq!(s.book_font_family, "serif", "book_font_family debe ser 'serif' cuando falta en el JSON");
    }

    #[test]
    fn default_book_font_size_es_18_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert_eq!(s.book_font_size, 18, "book_font_size debe ser 18 cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_book_font_family_inter() {
        let original = GlobalSettings {
            version: 1,
            book_font_family: "inter".to_string(),
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.book_font_family, "inter");
    }

    #[test]
    fn roundtrip_book_font_size_22() {
        let original = GlobalSettings {
            version: 1,
            book_font_size: 22,
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.book_font_size, 22);
    }

    #[test]
    fn default_export_folder_es_vacio_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert_eq!(s.export_folder, "", "export_folder debe ser vacío cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_export_folder() {
        let original = GlobalSettings {
            version: 1,
            export_folder: "/Users/juan/Documents".to_string(),
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.export_folder, "/Users/juan/Documents");
    }

    #[test]
    fn default_ui_locale_es_en_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert_eq!(s.ui_locale, "en", "ui_locale debe ser 'en' cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_ui_locale_es() {
        let original = GlobalSettings {
            version: 1,
            ui_locale: "es".to_string(),
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.ui_locale, "es");
    }

    #[test]
    fn autosave_interval_fuera_de_rango_cae_al_default() {
        let s = GlobalSettings {
            version: 1,
            autosave_interval_ms: 50,
            ..Default::default()
        };
        let validated = validate_settings(s);
        assert_eq!(validated.autosave_interval_ms, 500, "valor fuera de rango debe caer al default 500");
    }

    #[test]
    fn default_reading_goal_minutes_es_30_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert_eq!(s.reading_goal_minutes, 30, "reading_goal_minutes debe ser 30 cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_reading_seconds_by_day() {
        let mut map = std::collections::HashMap::new();
        map.insert("2026-09-15".to_string(), 120);
        let original = GlobalSettings {
            version: 1,
            reading_seconds_by_day: Some(map),
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(
            parsed.reading_seconds_by_day.unwrap().get("2026-09-15"),
            Some(&120),
            "reading_seconds_by_day debe preservarse en roundtrip"
        );
    }

    #[test]
    fn default_writing_days_es_vacio_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert!(s.writing_days.is_empty(), "writing_days debe ser vacío cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_writing_days() {
        let original = GlobalSettings {
            version: 1,
            writing_days: vec!["2026-09-13".to_string(), "2026-09-14".to_string()],
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.writing_days.len(), 2, "writing_days debe preservarse en roundtrip");
        assert_eq!(parsed.writing_days[0], "2026-09-13");
        assert_eq!(parsed.writing_days[1], "2026-09-14");
    }

    #[test]
    fn default_recent_projects_es_vacio_al_deserializar() {
        let json = r#"{"version": 1, "panels": {}}"#;
        let s: GlobalSettings = serde_json::from_str(json).unwrap();
        assert!(s.recent_projects.is_empty(), "recent_projects debe ser vacío cuando falta en el JSON");
    }

    #[test]
    fn roundtrip_recent_projects() {
        let original = GlobalSettings {
            version: 1,
            recent_projects: vec![RecentProject {
                path: "/Users/juan/libros/mi-libro".to_string(),
                name: "Mi Libro".to_string(),
                last_opened: "2026-09-15T10:00:00Z".to_string(),
                chapter_count: 12,
            }],
            ..Default::default()
        };
        let json = serde_json::to_string(&original).unwrap();
        let parsed: GlobalSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.recent_projects.len(), 1);
        assert_eq!(parsed.recent_projects[0].name, "Mi Libro");
        assert_eq!(parsed.recent_projects[0].chapter_count, 12);
    }
}
