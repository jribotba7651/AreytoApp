use std::fs;
use std::path::PathBuf;

fn collect_md_files(dir: &PathBuf, files: &mut Vec<PathBuf>) -> Result<(), String> {
    if !dir.exists() {
        return Ok(());
    }

    let entries = fs::read_dir(dir)
        .map_err(|e| format!("No se pudo leer {}: {}", dir.display(), e))?;

    let mut md_files: Vec<PathBuf> = entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.metadata().map_or(false, |m| m.is_file())
                && e.path().extension().map_or(false, |ext| ext == "md")
        })
        .map(|e| e.path())
        .collect();

    md_files.sort();
    files.extend(md_files);

    Ok(())
}

#[tauri::command]
pub fn export_book_markdown(
    project_path: String,
    include_terminados: bool,
    include_en_progreso: bool,
    output_path: String,
) -> Result<(), String> {
    let mut files: Vec<PathBuf> = Vec::new();

    // terminados primero (D-116)
    if include_terminados {
        let dir = PathBuf::from(&project_path).join("capitulos-terminados");
        collect_md_files(&dir, &mut files)?;
    }

    if include_en_progreso {
        let dir = PathBuf::from(&project_path).join("capitulos");
        collect_md_files(&dir, &mut files)?;
    }

    if files.is_empty() {
        return Err("No hay capítulos para exportar".to_string());
    }

    let mut parts: Vec<String> = Vec::new();
    for file in &files {
        let content = fs::read_to_string(file)
            .map_err(|e| format!("No se pudo leer {}: {}", file.display(), e))?;
        parts.push(content.trim_end_matches('\n').to_string());
    }

    let mut output = parts.join("\n\n---\n\n");
    output.push('\n');

    if let Some(parent) = PathBuf::from(&output_path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("No se pudo crear el directorio: {}", e))?;
        }
    }

    fs::write(&output_path, output.as_bytes())
        .map_err(|e| format!("No se pudo escribir el archivo: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static TEST_COUNTER: AtomicUsize = AtomicUsize::new(0);

    fn make_temp_project() -> PathBuf {
        let id = TEST_COUNTER.fetch_add(1, Ordering::SeqCst);
        let dir = std::env::temp_dir()
            .join(format!("areyto-test-{}-{}", std::process::id(), id));
        fs::create_dir_all(dir.join("capitulos")).unwrap();
        fs::create_dir_all(dir.join("capitulos-terminados")).unwrap();
        dir
    }

    fn cleanup(dir: &PathBuf) {
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn concatena_con_separador() {
        let project = make_temp_project();
        let cap_dir = project.join("capitulos");
        fs::write(cap_dir.join("cap-01.md"), "# Capítulo 1\n\nContenido uno.").unwrap();
        fs::write(cap_dir.join("cap-02.md"), "# Capítulo 2\n\nContenido dos.").unwrap();

        let out = project.join("salida.md");
        export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
        )
        .unwrap();

        let content = fs::read_to_string(&out).unwrap();
        assert!(content.contains("\n\n---\n\n"));
        assert!(content.starts_with("# Capítulo 1"));
        assert!(content.contains("# Capítulo 2"));
        cleanup(&project);
    }

    #[test]
    fn orden_lexico_correcto() {
        let project = make_temp_project();
        let cap_dir = project.join("capitulos");
        fs::write(cap_dir.join("cap-03.md"), "Cap tres").unwrap();
        fs::write(cap_dir.join("cap-01.md"), "Cap uno").unwrap();
        fs::write(cap_dir.join("cap-02.md"), "Cap dos").unwrap();

        let out = project.join("salida.md");
        export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
        )
        .unwrap();

        let content = fs::read_to_string(&out).unwrap();
        let pos1 = content.find("Cap uno").unwrap();
        let pos2 = content.find("Cap dos").unwrap();
        let pos3 = content.find("Cap tres").unwrap();
        assert!(pos1 < pos2 && pos2 < pos3);
        cleanup(&project);
    }

    #[test]
    fn terminados_antes_que_en_progreso_en_ambos() {
        let project = make_temp_project();
        fs::write(project.join("capitulos-terminados").join("cap-01.md"), "Terminado").unwrap();
        fs::write(project.join("capitulos").join("cap-02.md"), "En progreso").unwrap();

        let out = project.join("salida.md");
        export_book_markdown(
            project.to_str().unwrap().to_string(),
            true,
            true,
            out.to_str().unwrap().to_string(),
        )
        .unwrap();

        let content = fs::read_to_string(&out).unwrap();
        let pos_term = content.find("Terminado").unwrap();
        let pos_prog = content.find("En progreso").unwrap();
        assert!(pos_term < pos_prog);
        cleanup(&project);
    }

    #[test]
    fn newline_final_utf8() {
        let project = make_temp_project();
        fs::write(project.join("capitulos").join("cap-01.md"), "Contenido").unwrap();

        let out = project.join("salida.md");
        export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
        )
        .unwrap();

        let bytes = fs::read(&out).unwrap();
        assert_eq!(*bytes.last().unwrap(), b'\n');
        cleanup(&project);
    }

    #[test]
    fn error_si_sin_archivos() {
        let project = make_temp_project();
        let out = project.join("salida.md");
        let result = export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
        );
        assert!(result.is_err());
        cleanup(&project);
    }

    #[test]
    fn carpeta_inexistente_tratada_como_vacia() {
        let project = make_temp_project();
        // carpeta capitulos-terminados existe pero no tiene archivos
        // y capitulos tampoco
        let out = project.join("salida.md");
        let result = export_book_markdown(
            project.to_str().unwrap().to_string(),
            true,
            false,
            out.to_str().unwrap().to_string(),
        );
        assert!(result.is_err()); // vacía → error esperado
        cleanup(&project);
    }
}
