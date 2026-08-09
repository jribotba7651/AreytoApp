use std::fs;
use std::io;
use tauri::AppHandle;

fn read_docx_bytes(path: &str) -> Result<Vec<u8>, String> {
    let max_attempts = 3;
    for attempt in 1..=max_attempts {
        match fs::read(path) {
            Ok(bytes) => return Ok(bytes),
            Err(e) if e.kind() == io::ErrorKind::NotFound => {
                return Err(format!("Archivo no encontrado: {}", path));
            }
            Err(e) if attempt < max_attempts => {
                std::thread::sleep(std::time::Duration::from_millis(250));
                let _ = e;
            }
            Err(_) => {
                return Err(
                    "No se pudo leer el .docx. Si está en Synology Drive o iCloud, \
                     hazlo disponible sin conexión (o cópialo a una carpeta local) y reintenta."
                        .to_string(),
                );
            }
        }
    }
    unreachable!()
}

#[tauri::command]
pub async fn import_docx(app: AppHandle, input_path: String) -> Result<String, String> {
    use tauri_plugin_shell::ShellExt;

    let docx_bytes = read_docx_bytes(&input_path)?;

    let pid = std::process::id();
    let temp_input = std::env::temp_dir().join(format!("areyto-import-{}.docx", pid));
    let temp_output = std::env::temp_dir().join(format!("areyto-import-{}.md", pid));

    fs::write(&temp_input, &docx_bytes)
        .map_err(|e| format!("No se pudo escribir el temp de entrada: {}", e))?;

    let result = app
        .shell()
        .sidecar("pandoc")
        .map_err(|e| format!("No se pudo encontrar pandoc: {}", e))?
        .args([
            "-f", "docx",
            "-t", "gfm",
            "--wrap=none",
            "-o", temp_output.to_str().unwrap_or(""),
            temp_input.to_str().unwrap_or(""),
        ])
        .output()
        .await
        .map_err(|e| {
            let _ = fs::remove_file(&temp_input);
            format!("Error al ejecutar pandoc: {}", e)
        })?;

    let _ = fs::remove_file(&temp_input);

    if !result.status.success() {
        let _ = fs::remove_file(&temp_output);
        let stderr = String::from_utf8_lossy(&result.stderr).to_string();
        return Err(format!("pandoc falló: {}", stderr));
    }

    let markdown = fs::read_to_string(&temp_output)
        .map_err(|e| format!("No se pudo leer el archivo convertido: {}", e))?;
    let _ = fs::remove_file(&temp_output);

    Ok(markdown)
}
