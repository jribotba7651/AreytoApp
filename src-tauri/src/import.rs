use std::fs;
use tauri::AppHandle;

#[tauri::command]
pub async fn import_docx(app: AppHandle, input_path: String) -> Result<String, String> {
    use tauri_plugin_shell::ShellExt;

    let temp_path = std::env::temp_dir()
        .join(format!("areyto-import-{}.md", std::process::id()));

    let result = app
        .shell()
        .sidecar("pandoc")
        .map_err(|e| format!("No se pudo encontrar pandoc: {}", e))?
        .args([
            "-f", "docx",
            "-t", "markdown",
            "--wrap=none",
            "-o", temp_path.to_str().unwrap_or(""),
            &input_path,
        ])
        .output()
        .await
        .map_err(|e| format!("Error al ejecutar pandoc: {}", e))?;

    if !result.status.success() {
        let _ = fs::remove_file(&temp_path);
        let stderr = String::from_utf8_lossy(&result.stderr).to_string();
        return Err(format!("pandoc falló: {}", stderr));
    }

    let markdown = fs::read_to_string(&temp_path)
        .map_err(|e| format!("No se pudo leer el archivo convertido: {}", e))?;
    let _ = fs::remove_file(&temp_path);

    Ok(markdown)
}
