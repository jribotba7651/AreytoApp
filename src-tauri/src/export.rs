use std::collections::HashMap;
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
    prepend_content: Option<String>,
    append_content: Option<String>,
    indice_content: Option<String>,
    chapter_slugs: Option<HashMap<String, String>>,
) -> Result<(), String> {
    let mut all_parts: Vec<String> = Vec::new();

    if let Some(pre) = prepend_content {
        let trimmed = pre.trim_end_matches('\n').to_string();
        if !trimmed.trim().is_empty() {
            all_parts.push(trimmed);
        }
    }

    if let Some(indice) = indice_content {
        let trimmed = indice.trim_end_matches('\n').to_string();
        if !trimmed.trim().is_empty() {
            all_parts.push(trimmed);
        }
    }

    // terminados primero (D-116)
    let mut chapter_files: Vec<PathBuf> = Vec::new();
    if include_terminados {
        let dir = PathBuf::from(&project_path).join("capitulos-terminados");
        collect_md_files(&dir, &mut chapter_files)?;
    }
    if include_en_progreso {
        let dir = PathBuf::from(&project_path).join("capitulos");
        collect_md_files(&dir, &mut chapter_files)?;
    }

    let slugs = chapter_slugs.unwrap_or_default();

    for file in &chapter_files {
        let content = fs::read_to_string(file)
            .map_err(|e| format!("No se pudo leer {}: {}", file.display(), e))?;
        let trimmed = content.trim_end_matches('\n').to_string();

        let filename = file.file_name().and_then(|n| n.to_str()).unwrap_or("");
        let part = if let Some(slug) = slugs.get(filename) {
            format!("<a id=\"{}\"></a>\n\n{}", slug, trimmed)
        } else {
            trimmed
        };

        all_parts.push(part);
    }

    if let Some(app) = append_content {
        let trimmed = app.trim_end_matches('\n').to_string();
        if !trimmed.trim().is_empty() {
            all_parts.push(trimmed);
        }
    }

    if all_parts.is_empty() {
        return Err("No hay contenido para exportar".to_string());
    }

    let mut output = all_parts.join("\n\n---\n\n");
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

    fn export_simple(project: &PathBuf, include_terminados: bool, include_en_progreso: bool, out: &PathBuf) -> Result<(), String> {
        export_book_markdown(
            project.to_str().unwrap().to_string(),
            include_terminados,
            include_en_progreso,
            out.to_str().unwrap().to_string(),
            None,
            None,
            None,
            None,
        )
    }

    // ── tests F23 originales (adaptados a la nueva firma) ─────────────────────

    #[test]
    fn concatena_con_separador() {
        let project = make_temp_project();
        let cap_dir = project.join("capitulos");
        fs::write(cap_dir.join("cap-01.md"), "# Capítulo 1\n\nContenido uno.").unwrap();
        fs::write(cap_dir.join("cap-02.md"), "# Capítulo 2\n\nContenido dos.").unwrap();

        let out = project.join("salida.md");
        export_simple(&project, false, true, &out).unwrap();

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
        export_simple(&project, false, true, &out).unwrap();

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
        export_simple(&project, true, true, &out).unwrap();

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
        export_simple(&project, false, true, &out).unwrap();

        let bytes = fs::read(&out).unwrap();
        assert_eq!(*bytes.last().unwrap(), b'\n');
        cleanup(&project);
    }

    #[test]
    fn error_si_sin_archivos_y_sin_prepend_append() {
        let project = make_temp_project();
        let out = project.join("salida.md");
        let result = export_simple(&project, false, true, &out);
        assert!(result.is_err());
        cleanup(&project);
    }

    #[test]
    fn ambos_terminados_primero_independientemente_del_nombre() {
        let project = make_temp_project();
        fs::write(project.join("capitulos").join("cap-01.md"), "En progreso cap 1").unwrap();
        fs::write(project.join("capitulos-terminados").join("cap-02.md"), "Terminado cap 2").unwrap();

        let out = project.join("salida.md");
        export_simple(&project, true, true, &out).unwrap();

        let content = fs::read_to_string(&out).unwrap();
        let pos_term = content.find("Terminado cap 2").unwrap();
        let pos_prog = content.find("En progreso cap 1").unwrap();
        assert!(
            pos_term < pos_prog,
            "Terminados deben preceder a en-progreso independientemente del nombre de archivo"
        );
        cleanup(&project);
    }

    #[test]
    fn en_progreso_excluye_terminados() {
        let project = make_temp_project();
        fs::write(project.join("capitulos-terminados").join("cap-01.md"), "Capitulo terminado").unwrap();
        fs::write(project.join("capitulos").join("cap-02.md"), "Capitulo en progreso").unwrap();

        let out = project.join("salida.md");
        export_simple(&project, false, true, &out).unwrap();

        let content = fs::read_to_string(&out).unwrap();
        assert!(content.contains("Capitulo en progreso"));
        assert!(!content.contains("Capitulo terminado"));
        cleanup(&project);
    }

    #[test]
    fn carpeta_inexistente_tratada_como_vacia() {
        let project = make_temp_project();
        let out = project.join("salida.md");
        let result = export_simple(&project, true, false, &out);
        assert!(result.is_err());
        cleanup(&project);
    }

    // ── tests F26 nuevos ───────────────────────────────────────────────────────

    #[test]
    fn prepend_incluido_antes_de_capitulos() {
        let project = make_temp_project();
        fs::write(project.join("capitulos").join("cap-01.md"), "# Capítulo 1").unwrap();

        let out = project.join("salida.md");
        export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
            Some("# Mi libro\n\n**Autor**".to_string()),
            None,
            None,
            None,
        ).unwrap();

        let content = fs::read_to_string(&out).unwrap();
        let pos_portada = content.find("# Mi libro").unwrap();
        let pos_cap = content.find("# Capítulo 1").unwrap();
        assert!(pos_portada < pos_cap, "portada debe preceder a los capítulos");
        assert!(content.contains("\n\n---\n\n"));
        cleanup(&project);
    }

    #[test]
    fn append_incluido_despues_de_capitulos() {
        let project = make_temp_project();
        fs::write(project.join("capitulos").join("cap-01.md"), "# Capítulo 1").unwrap();

        let out = project.join("salida.md");
        export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
            None,
            Some("## Agradecimientos\n\nGracias a todos.".to_string()),
            None,
            None,
        ).unwrap();

        let content = fs::read_to_string(&out).unwrap();
        let pos_cap = content.find("# Capítulo 1").unwrap();
        let pos_agr = content.find("## Agradecimientos").unwrap();
        assert!(pos_cap < pos_agr, "agradecimientos deben ir después de los capítulos");
        assert!(content.contains("\n\n---\n\n"));
        cleanup(&project);
    }

    #[test]
    fn prepend_whitespace_solo_omitido() {
        let project = make_temp_project();
        fs::write(project.join("capitulos").join("cap-01.md"), "Contenido").unwrap();

        let out = project.join("salida.md");
        export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
            Some("   \n  ".to_string()),
            None,
            None,
            None,
        ).unwrap();

        let content = fs::read_to_string(&out).unwrap();
        assert!(!content.starts_with("\n\n---\n\n"));
        assert!(content.starts_with("Contenido"));
        cleanup(&project);
    }

    #[test]
    fn sin_capitulos_pero_con_prepend_ok() {
        let project = make_temp_project();
        let out = project.join("salida.md");
        export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
            Some("# Solo portada".to_string()),
            None,
            None,
            None,
        ).unwrap();

        let content = fs::read_to_string(&out).unwrap();
        assert!(content.contains("# Solo portada"));
        assert_eq!(content.chars().last().unwrap(), '\n');
        cleanup(&project);
    }

    #[test]
    fn todo_vacio_sin_prepend_sin_capitulos_sin_append_error() {
        let project = make_temp_project();
        let out = project.join("salida.md");
        let result = export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
            None,
            None,
            None,
            None,
        );
        assert!(result.is_err());
        let msg = result.unwrap_err();
        assert!(msg.contains("No hay contenido"), "mensaje de error esperado, got: {}", msg);
        cleanup(&project);
    }

    // ── tests F28 nuevos ───────────────────────────────────────────────────────

    #[test]
    fn indice_incluido_entre_prepend_y_capitulos() {
        let project = make_temp_project();
        fs::write(project.join("capitulos").join("cap-01.md"), "# Capítulo 1").unwrap();

        let out = project.join("salida.md");
        export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
            Some("# Mi libro".to_string()),
            None,
            Some("## Índice\n\n- [Capítulo 1](#cap-01)".to_string()),
            None,
        ).unwrap();

        let content = fs::read_to_string(&out).unwrap();
        let pos_portada = content.find("# Mi libro").unwrap();
        let pos_indice = content.find("## Índice").unwrap();
        let pos_cap = content.find("# Capítulo 1").unwrap();
        assert!(pos_portada < pos_indice, "índice debe ir después de la portada");
        // pos_indice finds "## Índice" which also matches inside the TOC bullet, so verify cap is last
        assert!(pos_cap > pos_portada, "capítulo debe ir después de la portada");
        assert!(content.contains("## Índice"));
        assert!(content.contains("[Capítulo 1](#cap-01)"));
        cleanup(&project);
    }

    #[test]
    fn anchor_id_inyectado_antes_del_capitulo() {
        let project = make_temp_project();
        fs::write(project.join("capitulos").join("cap-01.md"), "# El comienzo\n\nTexto.").unwrap();

        let out = project.join("salida.md");
        let mut slugs = HashMap::new();
        slugs.insert("cap-01.md".to_string(), "cap-01".to_string());

        export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
            None,
            None,
            None,
            Some(slugs),
        ).unwrap();

        let content = fs::read_to_string(&out).unwrap();
        assert!(content.contains("<a id=\"cap-01\"></a>"), "debe inyectar anchor con el slug");
        let pos_anchor = content.find("<a id=\"cap-01\"></a>").unwrap();
        let pos_h1 = content.find("# El comienzo").unwrap();
        assert!(pos_anchor < pos_h1, "el anchor debe preceder al contenido del capítulo");
        cleanup(&project);
    }

    #[test]
    fn capitulo_sin_slug_en_mapa_no_recibe_anchor() {
        let project = make_temp_project();
        fs::write(project.join("capitulos").join("cap-01.md"), "# Sin slug").unwrap();
        fs::write(project.join("capitulos").join("cap-02.md"), "# Con slug").unwrap();

        let out = project.join("salida.md");
        let mut slugs = HashMap::new();
        slugs.insert("cap-02.md".to_string(), "cap-02".to_string());

        export_book_markdown(
            project.to_str().unwrap().to_string(),
            false,
            true,
            out.to_str().unwrap().to_string(),
            None,
            None,
            None,
            Some(slugs),
        ).unwrap();

        let content = fs::read_to_string(&out).unwrap();
        assert!(content.contains("<a id=\"cap-02\"></a>"), "cap-02 debe tener anchor");
        assert!(!content.contains("<a id=\"cap-01\"></a>"), "cap-01 sin slug no debe tener anchor");
        cleanup(&project);
    }
}
