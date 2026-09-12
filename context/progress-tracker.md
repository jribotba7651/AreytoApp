# Writing IDE - Progress Tracker

Este archivo se actualiza con cada feature completada. Es la memoria del proyecto.

## Estado actual
- Fase activa: Visual Redesign (Atticus-inspired)
- Feature en progreso: ninguna
- Ultima feature completada: Polish Atticus - Word Count, Autosave Indicator, Drag Reorder (4 sub-tareas)
- Fecha de ultima actualizacion: 2026-09-12

## Features completadas

### 2026-09-12 - Polish Atticus: Word Count + Autosave Indicator + Drag Reorder (4 sub-tareas)
- Que se hizo:
  1. Word Count: barra inferior en el editor con conteo de palabras del capitulo activo (tiempo real) y total del libro. Formato i18n: "X words" / "X palabras". countWords() limpia markdown antes de contar. useBookWordCount() lee todos los capitulos para el total.
  2. Chapter Title Editable: ya estaba implementado (ChapterListItem doble-click + renameChapterTitle en project-fs.ts).
  3. Autosave Indicator: reemplazo del texto plano por indicadores visuales. Saving = punto verde pulsante (animate-pulse). Saved = checkmark verde (desaparece tras 2s). Idle = nada visible. Error = texto rojo. Removido import de SaveStatus type (no usado).
  4. Drag to Reorder Chapters: HTML5 drag-and-drop nativo en sidebar. Solo capitulos in-progress son arrastrables. Al soltar, reorderChapters() en project-fs.ts renombra archivos con nombres temporales (__reorder_N.md) y luego al orden final (cap-01.md, cap-02.md, etc). Indicador visual border-t-accent al arrastrar sobre un item. Si el capitulo activo cambia de nombre, se re-selecciona automaticamente.
- Archivos modificados:
  - src/components/panels/EditorPanel.tsx (+countWords, +useBookWordCount hook, +barra inferior con word count)
  - src/components/layout/TopTabs.tsx (indicador saving: punto verde pulsante, saved: checkmark, idle: nada)
  - src/components/sidebar/ChapterListItem.tsx (+props drag-and-drop: onDragStart, onDragOver, onDrop, onDragEnd, isDragOver, draggable)
  - src/components/sidebar/ChapterList.tsx (+estado drag/dragOver, +handleDrop con reorderChapters, separacion in-progress/finished)
  - src/lib/project-fs.ts (+reorderChapters: renombra a temporales, luego a cap-XX.md final)
  - src/i18n/locales/en.json (+editor.wordCount, +editor.bookWordCount)
  - src/i18n/locales/es.json (+editor.wordCount, +editor.bookWordCount)
- Decisiones tomadas:
  - D-248: countWords() limpia headers (^# ...) y caracteres markdown antes de contar. No cuenta titulo H1 como palabras del cuerpo.
  - D-249: useBookWordCount() lee todos los capitulos asincrónicamente al montar, y recalcula cuando cambia la lista de capitulos. El capitulo activo usa el contenido en memoria (tiempo real).
  - D-250: El reordenamiento usa nombres temporales (__reorder_N.md) para evitar colisiones cuando dos archivos intercambian posiciones.
  - D-251: Solo los capitulos in-progress son arrastrables. Los finished se muestran despues, no participan en el drag.
  - D-252: El autosave indicator usa animate-pulse de Tailwind para el punto verde, consistente con la paleta de estados (--success: green-600).
- Tests: tsc --noEmit limpio
- Bugs encontrados: ninguno

### 2026-09-12 - Polish visual Atticus (4 sub-tareas)
- Que se hizo:
  1. FormatToolbar: toolbar de formato encima del editor con botones Bold (Cmd+B), Italic (Cmd+I), Underline (Cmd+U), separadores verticales, Align Left/Center/Right, Insert Link (Cmd+K), Insert Image. Usa iconos de lucide-react. Se expuso EditorView de ChapterEditor via forwardRef + useImperativeHandle. toggleWrap actualizado para soportar marcadores asimetricos (<u></u>). setAlignment usa div con text-align inline. insertImage genera sintaxis ![alt](url).
  2. Sidebar izquierdo con secciones colapsables: CollapsibleSection reutilizable con chevron y animacion. FrontmatterSection (Title Page, Copyright, Dedication, Details), Chapters (con numero, titulo, checkmark para terminados, refresh button como accion del header), BackmatterSection (Acknowledgements, About Author, Other Books). NewChapterButton y CloseChapterButton dentro de la seccion Chapters.
  3. Polish general: bg-white hardcodeado en TopTabs reemplazado por bg-bg-editor (compatible dark mode). Verificacion de tokens en todos los componentes nuevos y existentes. Sin colores hardcodeados fuera de contextos decorativos.
  4. Preview modes: Draft = sin margenes ni sombra (ancho completo max-w-3xl). Print = hoja con sombra, padding generoso, fondo bg-editor. Print Proof = hoja con borde gris grueso (12px #e0e0e0) simulando margenes de impresora, fondo ligeramente gris (#f0f0f0), sin sombra externa.
- Archivos creados:
  - src/components/editor/FormatToolbar.tsx (toolbar de formato con botones, separadores, acciones via ref al editor)
  - src/components/sidebar/CollapsibleSection.tsx (componente colapsable reutilizable con chevron)
- Archivos modificados:
  - src/components/editor/ChapterEditor.tsx (forwardRef + useImperativeHandle para exponer getView)
  - src/components/editor/markdown-format.ts (toggleWrap con marcadores asimetricos, insertImage, setAlignment, export de funciones)
  - src/components/panels/EditorPanel.tsx (FormatToolbar integrado encima del editor, ref al ChapterEditor)
  - src/components/sidebar/FrontmatterSection.tsx (usa CollapsibleSection)
  - src/components/sidebar/BackmatterSection.tsx (usa CollapsibleSection)
  - src/components/panels/SidebarPanel.tsx (Chapters como CollapsibleSection con actions, botones dentro)
  - src/components/sidebar/ChapterListItem.tsx (prop index, numero de capitulo, checkmark para terminados)
  - src/components/sidebar/ChapterList.tsx (pasa index a ChapterListItem)
  - src/components/layout/TopTabs.tsx (bg-white -> bg-bg-editor para dark mode)
  - src/components/layout/BookTabContent.tsx (3 modos de preview: draft, print, proof con estilos distintos)
- Decisiones tomadas:
  - D-243: FormatToolbar accede al EditorView via ref expuesto por ChapterEditor. No usa estado global. Cada boton ejecuta la accion y devuelve foco al editor.
  - D-244: Underline usa marcadores HTML (<u></u>) porque markdown no tiene sintaxis nativa para subrayado.
  - D-245: Alineacion usa <div style="text-align: X"> wrapping la linea seleccionada. Es la convencion estandar para markdown extendido.
  - D-246: CollapsibleSection es generico (title, children, actions, defaultOpen). Estado local con useState, no persistido.
  - D-247: Print Proof usa borde gris grueso (12px) para simular los margenes de impresora. Es una aproximacion visual, no medidas reales.
- Tests: tsc --noEmit limpio
- Bugs encontrados: ninguno

### 2026-09-12 - Rediseno visual estilo Atticus (4 sub-tareas)
- Que se hizo:
  1. ThemeGallery: tarjetas muestran texto REAL del libro (capitulo activo o primer capitulo) en vez de lorem ipsum. Grid 3 columnas con borde accent (border-2) en tema seleccionado. Corazon de favorito por tarjeta (estado local con Set). stripMarkdown() limpia headers/bold/links del sample text. Prop sampleText pasada desde BookTabContent.
  2. Preview de pagina: reemplazo del DeviceFrame/device selector con vista estilo hoja impresa con box-shadow y padding generoso (48px 56px). Selector de vista Print/Draft/Print Proof. Navegacion Previous Chapter / Next Chapter con indicador "Capitulo X de Y". Modo draft sin sombra (ancho completo). Cada capitulo se renderiza individualmente.
  3. Writing Mode sidebar derecho: 5 iconos verticales a la derecha del editor (T=editor settings, lupa=find/replace, BookOpen=notes stub, MessageSquare=comments stub, Bookmark=bookmarks stub). Click en T abre panel con font family select, font size slider, line height slider, paragraph indent/spaced toggle y justified checkbox. Click en lupa abre panel find/replace con tabs Chapter/Find, inputs de busqueda y reemplazo, botones Find Next y Replace.
  4. Top Bar: nombre del libro a la izquierda, toggle Writing/Formatting centrado (pill toggle con bg-white y shadow en activo), iconos de Archive y Settings para tabs secundarios, acciones Export/Close/Shortcuts/About a la derecha.
- Archivos creados:
  - src/components/panels/WritingToolbar.tsx (sidebar derecho con iconos, EditorSettingsPanel y FindReplacePanel)
- Archivos modificados:
  - src/components/book/ThemeGallery.tsx (texto real, favoritos, border-2 accent, stripMarkdown)
  - src/components/layout/BookTabContent.tsx (preview hoja impresa, selector Print/Draft/Proof, nav capitulos, remover DeviceFrame/renderContent)
  - src/components/layout/TopTabs.tsx (rediseno completo: nombre izquierda, toggle centro, acciones derecha)
  - src/components/layout/ChapterTabContent.tsx (integrar WritingToolbar en MiddlePanels)
  - src/types/layout.ts (+PreviewMode type, +previewMode en LayoutState)
  - src/stores/layoutStore.ts (+previewMode state, +setPreviewMode action)
  - src/i18n/locales/en.json (+previewMode, +previewNav, +writingToolbar, +topbar.writing/formatting)
  - src/i18n/locales/es.json (+previewMode, +previewNav, +writingToolbar, +topbar.writing/formatting)
- Decisiones tomadas:
  - D-237: El preview de pagina renderiza un capitulo a la vez con navegacion, en vez del libro completo como scroll. Simula hoja impresa real.
  - D-238: El toggle Writing/Formatting en TopBar mapea directamente a tabs capitulo/libro. Es una vista simplificada del tab system.
  - D-239: Los tabs Terminados y Ajustes se representan como iconos (Archive, Settings) en la barra derecha, accesibles pero secundarios.
  - D-240: WritingToolbar es un sidebar estrecho (iconos 32px) que se expande a 224px (w-56) al abrir un panel. Vive dentro de MiddlePanels, a la derecha del editor.
  - D-241: EditorSettingsPanel y FindReplacePanel son estado local por ahora, no conectados al editor. Se conectaran en una feature futura.
  - D-242: Favoritos de temas usan estado local (useState Set), no persisten entre sesiones. Suficiente para la primera iteracion.
- Tests: tsc --noEmit limpio
- Bugs encontrados: ninguno

### 2026-09-12 - UI para gestionar portada del libro
- Que se hizo: En el tab Libro, vista Formato, se agrego una seccion de portada debajo de BookSettings. Si existe una imagen de portada en la raiz del proyecto (portada.png/jpg/jpeg o cover.png/jpg/jpeg), muestra un thumbnail pequeno con opcion de cambiarla. Si no hay portada, muestra un hint y un boton "Seleccionar imagen" que abre el file picker nativo (tauri-plugin-dialog open()), copia la imagen seleccionada a la raiz del proyecto como portada.jpg via el comando Tauri copy_file, y refresca la deteccion. Reutiliza detectCoverImage y COVER_FILENAMES de export-service.ts. El thumbnail se muestra via convertFileSrc (protocolo asset de Tauri).
- Archivos creados:
  - src/components/book/BookCoverSection.tsx (componente de portada con deteccion, thumbnail, file picker, copia)
- Archivos modificados:
  - src/components/layout/BookTabContent.tsx (+import y render de BookCoverSection en vista format)
  - src/i18n/locales/en.json (+seccion book.cover con 7 keys: title, detected, nocover, nocoverHint, selectImage, copySuccess, copyError)
- Decisiones tomadas:
  - D-234: La portada se copia siempre como portada.jpg (nombre fijo) para consistencia. Si el usuario selecciona un PNG, se copia tal cual pero con nombre .jpg. Esto es aceptable porque los viewers de imagenes y Tauri no dependen de la extension para decodificar.
  - D-235: La deteccion se hace al montar el componente (no polling). Despues de copiar una nueva portada se llama refresh() manualmente.
  - D-236: El componente vive en la vista format (junto a ThemeGallery, ThemeControls, BookSettings) porque es configuracion visual del libro, no contenido.
- Tests: tsc --noEmit limpio
- Bugs encontrados: ninguno

### 2026-09-12 - Mas temas built-in (Clean Modern + Hispanico Clasico)
- Que se hizo: Se agregaron 2 temas built-in nuevos al catalogo de temas en theme.ts. Ahora hay 5 temas built-in en total. Clean Modern: sans-serif (Helvetica Neue), sin sangria, espaciado generoso entre parrafos (1.2em), interlineado amplio (1.85), headings alineados a la izquierda, sin ornamentos. Hispanico Clasico: serif (Palatino), sangria francesa (1.8em), justificado, drop caps activado, section break con tilde (~), headings centrados con numeracion por palabra, medida compacta (64ch). Ambos temas aparecen automaticamente en ThemeGallery y estan disponibles para seleccion.
- Archivos modificados:
  - src/lib/theme.ts (CLEAN_MODERN y HISPANICO_CLASICO como nuevas constantes, registradas en BUILT_IN_THEMES)
- Decisiones tomadas:
  - D-232: Clean Modern usa Helvetica Neue como fuente primaria (disponible en macOS nativamente) con fallbacks a Segoe UI y system-ui.
  - D-233: Hispanico Clasico usa Palatino como fuente primaria (fuente clasica hispanica disponible en macOS y Windows) con fallback a Book Antiqua. Drop caps y ornamento ~ para section breaks dan un toque de libro espanol tradicional.
- Tests: 425 TS -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-12 - i18n del menu nativo de Tauri
- Que se hizo: Los items del menu nativo de Tauri (File/Open Project/New Project/Close Project) ahora se traducen segun el idioma del sistema operativo. Se detecta el locale del sistema via las variables de entorno LANG/LC_ALL/LC_MESSAGES. Si el locale empieza con "es", se usan labels en espanol (Archivo/Abrir proyecto/Nuevo proyecto/Cerrar proyecto). De lo contrario, se muestran en ingles. Los PredefinedMenuItems (About, Quit) siguen usando la traduccion nativa de macOS.
- Archivos modificados:
  - src-tauri/src/lib.rs (funciones detect_system_lang y menu_labels, struct MenuLabels; menu builder usa labels dinamicos)
- Decisiones tomadas:
  - D-229: Deteccion de idioma via env vars del sistema (LANG, LC_ALL, LC_MESSAGES). No requiere crate adicional. En macOS, estas variables se setean automaticamente segun las preferencias del sistema al lanzar una .app.
  - D-230: Solo 2 idiomas soportados (en/es), consistente con la configuracion i18n existente del frontend (react-i18next con en.json/es.json).
  - D-231: PredefinedMenuItems (About, Quit, separadores) no se traducen manualmente; macOS los localiza automaticamente segun las preferencias del sistema.
- Tests: cargo check OK, tsc --noEmit limpio
- Bugs encontrados: ninguno

### 2026-09-12 - Watch de frontmatter/ y backmatter/
- Que se hizo: El file watcher en Rust ahora monitorea las carpetas frontmatter/ y backmatter/ ademas de capitulos/ y capitulos-terminados/. Cuando un archivo de frontmatter o backmatter cambia externamente (ej. Claude Code edita dedicatoria.md), el tab Libro recarga automaticamente los datos del libro. Se agrego un contador sectionVersion al projectStore que se incrementa cuando el watcher detecta cambios en frontmatter/ o backmatter/. BookTabContent usa sectionVersion como dependencia de su useEffect de carga, asi que el preview del libro se actualiza en vivo.
- Archivos modificados:
  - src-tauri/src/watcher.rs (agrega frontmatter/ y backmatter/ al watch, refactor a loop sobre array de dirs)
  - src/stores/projectStore.ts (sectionVersion: number, incrementSectionVersion(), reset en closeProject)
  - src/hooks/useProjectWatcher.ts (detecta cambios en frontmatter//backmatter/ y llama incrementSectionVersion)
  - src/components/layout/BookTabContent.tsx (suscribe a sectionVersion, lo usa como dependencia del useEffect de loadBook)
- Decisiones tomadas:
  - D-226: sectionVersion es un contador incremental que dispara re-render en componentes que lo consumen. Patron identico a editorVersion.
  - D-227: La deteccion de cambios en frontmatter/backmatter usa includes('/frontmatter/') e includes('/backmatter/') sobre los paths reportados por el watcher. Simple y robusto.
  - D-228: Los editores de frontmatter/backmatter no se recargan automaticamente con cambios externos (su propia logica de autosave maneja sus saves). El beneficio principal es que el tab Libro refleja cambios hechos por herramientas externas.
- Tests: 425 TS -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-11 - Polish - Renombrar capitulo desde sidebar (doble-click)
- Que se hizo: Doble-click en un capitulo en la sidebar entra en modo edicion inline. El usuario puede editar el titulo y confirmar con Enter o blur, o cancelar con Escape. Al confirmar, se reemplaza el H1 del archivo .md en disco, se actualiza la lista de capitulos, y si es el capitulo activo se recarga el contenido en el editor. Funcion pura replaceChapterTitle en project-fs.ts reemplaza el primer H1 o prepend uno nuevo si no existe.
- Archivos creados: ninguno
- Archivos modificados:
  - src/components/sidebar/ChapterListItem.tsx (estado editing/draft, input inline con doble-click, commit con Enter/blur, cancel con Escape, prop onRename)
  - src/components/sidebar/ChapterList.tsx (handleRename que llama renameChapterTitle, actualiza store chapters, recarga editor si es capitulo activo)
  - src/lib/project-fs.ts (replaceChapterTitle funcion pura, renameChapterTitle funcion async que lee/reemplaza/escribe)
  - src/lib/project-fs.test.ts (3 tests nuevos para replaceChapterTitle: reemplazo, prepend sin H1, solo primer H1)
- Decisiones tomadas:
  - D-223: Renombrar edita el H1 del contenido .md, no el filename del archivo. El filename (cap-01.md, cap-02.md) permanece estable para no romper referencias de git.
  - D-224: Si el capitulo renombrado es el activo, se hace updateContent + setLastSavedContent + incrementEditorVersion para que el editor remonte con el contenido actualizado.
  - D-225: replaceChapterTitle es funcion pura exportada, testeada independientemente.
- Tests: 425 TS -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-11 - Polish - Atajos de formato en editor (Cmd+B/I/K)
- Que se hizo: Atajos de formato markdown en el editor CodeMirror. Cmd+B alterna negrita (**texto**), Cmd+I alterna cursiva (*texto*), Cmd+K inserta enlace ([texto](url)). Todos los atajos funcionan como toggle: si el texto seleccionado ya esta envuelto en marcadores, los remueve. Si no hay seleccion, inserta los marcadores y posiciona el cursor entre ellos. Los atajos aparecen en el modal de atajos de teclado (ShortcutsDialog).
- Archivos creados:
  - src/components/editor/markdown-format.ts (toggleWrap generico + insertLink, keymap de CodeMirror)
  - src/components/editor/markdown-format.test.ts (7 tests: bold wrap/unwrap/cursor, italic wrap/unwrap, link con seleccion/sin seleccion)
- Archivos modificados:
  - src/components/editor/ChapterEditor.tsx (import y registro de markdownFormatKeymap antes de defaultKeymap)
  - src/components/shortcuts/ShortcutsDialog.tsx (3 filas nuevas para bold/italic/link con display manual)
  - src/i18n/locales/en.json (shortcuts.bold/italic/link)
  - src/i18n/locales/es.json (shortcuts.bold/italic/link)
- Decisiones tomadas:
  - D-220: markdownFormatKeymap registrado ANTES de defaultKeymap para que Cmd+B/I/K intercepten antes que cualquier binding default de CodeMirror.
  - D-221: toggleWrap es generico (recibe el marcador como string). Soporta **, *, ~~, etc. sin duplicar logica.
  - D-222: Los atajos de formato son keybindings de CodeMirror (no globales via useKeyboardShortcuts) porque solo aplican cuando el editor tiene foco.
- Tests: 422 TS -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-11 - F50 - Validacion de estructura al abrir proyecto
- Que se hizo: openProject ahora verifica y crea automaticamente las 4 subcarpetas requeridas (frontmatter, capitulos, capitulos-terminados, backmatter) al abrir un proyecto. Si proyecto.json existe pero faltan carpetas (por ejemplo, un proyecto migrado o con estructura incompleta), se crean con ensureDir en vez de fallar. Constante REQUIRED_SUBDIRS extraida para DRY con createProject.
- Archivos modificados:
  - src/lib/project-fs.ts (REQUIRED_SUBDIRS constante, openProject ahora llama ensureDir por cada subcarpeta tras parsear proyecto.json)
  - src/lib/project-fs.test.ts (test actualizado para mockear ensure_dir x4, verifica que las 4 subcarpetas se aseguran al abrir)
- Decisiones tomadas:
  - D-218: Estrategia de autocuracion en vez de error. Si proyecto.json existe, las carpetas faltantes se crean automaticamente. Mas robusto que mostrar error al usuario.
  - D-219: Se reutiliza la misma lista REQUIRED_SUBDIRS que createProject usa. DRY.
- Tests: 415 TS -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-11 - Item 14 - Theme builder: preview en tiempo real
- Que se hizo: En el panel ThemeControls (modo Formatear), se agrego una muestra de texto en tiempo real que refleja el tema actual. La muestra incluye un heading H1 ("El viaje comienza"), dos parrafos de prosa con tipografia, sangria, interlineado y justificacion del tema aplicados, y el ornamento de section break si esta configurado. La muestra se actualiza instantaneamente al cambiar cualquier control del tema (font family, font size, line height, indent, spacing, justify, ornament, drop caps). CSS vars del tema aplicadas via themeToCssVars sobre el contenedor del preview.
- Archivos modificados:
  - src/components/book/ThemeControls.tsx (import themeToCssVars, bloque "Live preview" con heading/parrafos/section break)
  - src/i18n/locales/en.json (book.themeControls.previewTitle)
  - src/i18n/locales/es.json (book.themeControls.previewTitle)
- Decisiones tomadas:
  - D-212: El preview usa texto de muestra en espanol hardcodeado (no i18n) porque es contenido literario de ejemplo, no UI chrome. Consistente con que el producto es para escritores en espanol.
  - D-213: El preview se coloca entre los controles y el boton "Guardar como preset", separado por borde superior sutil.
- Tests: 415 TS + 41 Rust -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-11 - Item 12 - Soporte de imagenes en capitulos markdown
- Que se hizo: Las imagenes insertadas en capitulos via sintaxis markdown estandar (![alt](ruta)) ahora se renderizan en el preview del tab Libro y en el preview del editor. Rutas relativas al proyecto se resuelven via convertFileSrc de Tauri (protocolo asset). En exports EPUB y DOCX, pandoc recibe --resource-path apuntando al directorio del proyecto, lo que permite resolver y embeber las imagenes automaticamente. En export markdown, las rutas se mantienen relativas.
- Archivos modificados:
  - src/components/book/BookMarkdown.tsx (import convertFileSrc y useMemo; funcion resolveImageSrc para resolver rutas relativas; componente img dinamico en useMemo con figure centrada, max-width 100%, figcaption con alt text; prop projectRootPath)
  - src/components/book/BookChapter.tsx (prop projectRootPath propagado a BookMarkdown)
  - src/components/layout/BookTabContent.tsx (pasa currentProject.rootPath como projectRootPath a BookChapter)
  - src/components/panels/EditorPanel.tsx (pasa currentProject.rootPath como projectRootPath a BookMarkdown)
  - src-tauri/src/export.rs (--resource-path project_path en export_book_docx y export_book_epub para que pandoc resuelva imagenes relativas)
- Decisiones tomadas:
  - D-214: Las imagenes se renderizan centradas en un <figure> con max-width: 100% y height: auto. El alt text se muestra como <figcaption> en italica debajo de la imagen.
  - D-215: Rutas absolutas y URLs externas (http/https/data:) se pasan sin modificar. Solo las rutas relativas se resuelven contra projectRootPath via convertFileSrc.
  - D-216: Para exports, --resource-path de pandoc resuelve imagenes relativas sin necesidad de copiar archivos. EPUB las embebe dentro del .epub, DOCX las incluye inline. No se requieren dependencias nuevas.
  - D-217: El protocolo asset de Tauri v2 funciona sin configuracion adicional cuando CSP es null (configuracion actual del proyecto).
- Tests: 415 TS + 41 Rust -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-11 - F37 performance - Watcher debounce en Rust
- Que se hizo: El file watcher en Rust (watcher.rs) ahora incluye debounce de 500ms y deduplicacion de eventos redundantes del mismo archivo dentro de 100ms. Antes, cada evento del filesystem se emitia inmediatamente al front, causando rafagas excesivas. Ahora un hilo flusher acumula paths en un buffer compartido (Arc<Mutex>), y solo emite el batch al front cuando pasan 500ms sin nuevos eventos. Ademas, eventos del mismo path dentro de 100ms se descartan (dedup por timestamp). El debounce de 300ms en el front (useProjectWatcher) se mantiene sin cambios. Comportamiento visible identico.
- Archivos modificados:
  - src-tauri/src/watcher.rs (DebouncedBuffer con pending/recent/stopped, hilo flusher con tick de 50ms, dedup por path con ventana de 100ms, flush tras 500ms de quietud, limpieza de entries viejas en recent)
  - src-tauri/src/lib.rs (WatcherState::new() en lugar de constructor manual)
- Decisiones tomadas:
  - D-209: Debounce en Rust es complementario al del front (300ms). El de Rust reduce el volumen de eventos IPC; el del front agrupa los que llegan cercanos. Total efectivo ~500ms en el peor caso.
  - D-210: Dedup por path usa HashMap<String, Instant> con ventana de 100ms. Se limpia automaticamente tras cada flush para no crecer indefinidamente.
  - D-211: Hilo flusher usa tick de 50ms para balance entre latencia y uso de CPU. Se detiene limpiamente via flag stopped al llamar unwatch_project.
- Tests: 415 TS + 41 Rust -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-11 - Item 8 - Callouts/blockquotes visuales en preview Libro
- Que se hizo: Los blockquotes de markdown en el preview del tab Libro ahora se renderizan como callouts visuales. Se detecta el tipo por la primera linea del blockquote: `> [!NOTA]`, `> [!AVISO]`, `> [!CITA]`. Cada tipo tiene icono (lucide-react), borde izquierdo de color (info/warning/accent-muted) y fondo suave con opacidad 5%. Blockquotes sin tag se renderizan como cita generica (estilo anterior). CSS puro via Tailwind tokens, sin dependencias nuevas.
- Archivos modificados:
  - src/components/book/BookMarkdown.tsx (componente BookCallout con deteccion de tipo, funciones extractTextFromNode y stripCalloutTag para parsear el tag del primer parrafo, import de iconos Info/AlertTriangle/Quote de lucide-react)
- Decisiones tomadas:
  - D-206: Los 3 tipos de callout (nota/aviso/cita) se detectan case-insensitive via regex en el texto del primer parrafo hijo del blockquote. El tag se remueve del contenido visible.
  - D-207: Colores usan tokens existentes del tema (info, warning, accent-muted). Fondo con opacidad Tailwind /5 para efecto suave.
  - D-208: Blockquotes sin tag [!...] mantienen el estilo anterior (borde accent-muted, italica, sin icono) como fallback a cita generica.
- Tests: 415 TS -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-11 - Item 13 - Pre-export check modal
- Que se hizo: Validacion pre-export antes de abrir cualquier dialogo de exportacion. Antes de mostrar ExportBookDialog (md/docx/epub), se verifican 3 condiciones: titulo no vacio, autor no vacio, al menos 1 capitulo con contenido. Si alguna falla, se muestra PreExportCheckModal con la lista de problemas y opciones de "Continuar de todas formas" o "Cancelar". Tambien se corrigieron 2 errores de TypeScript: variables mockReadSobreElAutor y mockReadOtrosLibros declaradas pero no usadas en export-service.test.ts (eliminadas junto con sus imports innecesarios).
- Archivos creados:
  - src/components/book/PreExportCheckModal.tsx (modal con lista de problemas y botones continuar/cancelar)
- Archivos modificados:
  - src/components/layout/BookTabContent.tsx (logica de validacion pre-export con useEffect interceptor, estado preExportProblems/pendingExportTarget, ref skipPreCheck para bypass tras "continuar", renderizado del PreExportCheckModal)
  - src/i18n/locales/en.json (modal.preExportCheck.* - 7 claves nuevas)
  - src/i18n/locales/es.json (mismas claves en espanol)
  - src/lib/export-service.test.ts (eliminadas variables mockReadSobreElAutor y mockReadOtrosLibros no usadas, y sus imports)
- Decisiones tomadas:
  - D-203: La validacion intercepta showExportDialog via useEffect. Un ref skipPreCheck evita re-validar cuando el usuario elige "continuar de todas formas" tras ver los problemas.
  - D-204: Las 3 validaciones son: titulo no vacio (frontmatter.titulo.titulo), autor no vacio (frontmatter.titulo.autor), al menos 1 seccion kind=chapter con content.trim() no vacio.
  - D-205: El modal es informativo, no bloqueante. El usuario siempre puede continuar con la exportacion si lo desea.
- Tests: 415 TS -- todos verdes
- Bugs encontrados: 2 variables TS no usadas en export-service.test.ts (corregidas como parte de esta tarea)

### 2026-09-11 - Epic4-S4 - Book Settings (Trim/Margins) con preview aproximado
- Que se hizo: Slice 4 del Epic 4 (item 9). Panel Book Settings en modo Formatear con controles para trim size (ancho/alto en pulgadas) y margins (top/bottom/inner/outer en pulgadas). Valores default 6x9 pulgadas, margins 1in todos. Los cambios persisten en proyecto.json via updateProjectMeta. El preview en BookMarkdown refleja los margins aproximados visualmente usando CSS padding y max-width proporcional al trim size (escala 96px/in * 0.5 para caber en pantalla).
- Archivos creados:
  - src/components/book/BookSettings.tsx (panel con inputs numericos para trim y margins)
- Archivos modificados:
  - src/types/project.ts (interfaz BookSettings, constante DEFAULT_BOOK_SETTINGS, campo opcional bookSettings en Project)
  - src/lib/project-fs.ts (bookSettings en ProyectoJson, en updateProjectMeta, import del tipo)
  - src/stores/projectStore.ts (bookSettings agregado al Pick de updateProjectMeta)
  - src/components/book/BookMarkdown.tsx (funcion bookSettingsToStyle calcula padding/max-width proporcional; prop bookSettings)
  - src/components/book/BookChapter.tsx (prop bookSettings propagado a BookMarkdown)
  - src/components/layout/BookTabContent.tsx (import BookSettings, renderizado debajo de ThemeControls en modo Formatear, prop bookSettings a BookChapter)
  - src/i18n/locales/en.json (book.bookSettings.* - 9 claves nuevas)
  - src/i18n/locales/es.json (mismas claves en espanol)
- Decisiones tomadas:
  - D-200: Los valores de book settings se guardan en proyecto.json (por proyecto, no global). Cada libro puede tener trim/margins distintos.
  - D-201: El preview usa escala 96px por pulgada reducida al 50% para que quepa en el viewport. Es una aproximacion visual, no pixel-perfect.
  - D-202: Los defaults (6x9, 1in margins) son los mas comunes para trade paperback en KDP/IngramSpark.
- Tests: 409 TS -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-11 - Epic4-S3 - ThemeControls editables + Guardar preset custom
- Que se hizo: Slice 3 del Epic 4 con 2 sub-tareas:
  1. Controles editables de Theme (temaOverrides): panel ThemeControls en modo Formatear que permite al usuario cambiar font family, font size, line height, text indent, paragraph spacing, justify on/off, section break ornament, y drop caps on/off. Los cambios se guardan como temaOverrides en proyecto.json via updateProjectMeta en el projectStore. El preview en BookMarkdown se actualiza en tiempo real via resolveTheme+themeToCssVars.
  2. Guardar preset custom: boton "Guardar como preset" en ThemeControls que guarda el tema actual (resolved) con nombre custom en un array customThemes en GlobalSettings. Los presets custom aparecen en ThemeGallery junto a los built-in. Seleccionar un tema desde ThemeGallery ahora actualiza el tema del proyecto y limpia los overrides.
- Archivos creados:
  - src/components/book/ThemeControls.tsx (panel de controles editables del tema con save-as-preset)
- Archivos modificados:
  - src/stores/projectStore.ts (nuevo metodo updateProjectMeta que llama a project-fs y actualiza el state local)
  - src/stores/settingsStore.ts (estado customThemes: Theme[], metodo addCustomTheme, carga en load())
  - src/lib/settings.ts (customThemes?: Array<Record<string, unknown>> en GlobalSettings)
  - src/components/book/ThemeGallery.tsx (props onSelectTheme y customThemes; thumbnails clickeables con role=button)
  - src/components/layout/BookTabContent.tsx (ThemeControls integrado debajo de ThemeGallery en modo format; onSelectTheme wiring; customThemes propagado)
  - src/i18n/locales/en.json (book.themeControls.* - 15 claves nuevas)
  - src/i18n/locales/es.json (mismas claves en espanol)
- Decisiones tomadas:
  - D-196: Al seleccionar un tema desde ThemeGallery, se limpia temaOverrides (se pasa undefined) para que el tema seleccionado se aplique limpio. Los overrides solo se acumulan mientras el usuario ajusta el tema activo.
  - D-197: Los custom themes se guardan en GlobalSettings (no por proyecto). Esto permite reutilizar presets entre proyectos distintos.
  - D-198: El id de un custom theme usa el patron custom-{timestamp} para evitar colisiones con built-in themes.
  - D-199: ThemeControls construye overrides de forma incremental, preservando overrides previos al agregar nuevos cambios.
- Tests: 409 TS -- todos verdes
- Bugs encontrados: ninguno

### 2026-09-11 - Epic4-S2 - Export persistente + toggle Escribir/Formatear + marco de dispositivo
- Que se hizo: Slice 2 del Epic 4 con 3 sub-tareas:
  1. Boton Export persistente en TopTabs: boton con icono Upload visible en la barra superior cuando hay proyecto abierto, junto al nombre del proyecto. Al hacer click cambia al tab Libro y abre ExportBookDialog. Visible en todos los tabs.
  2. Toggle Escribir/Formatear en tab Libro: barra secundaria con dos botones (Escribir/Formatear). Estado bookViewMode en layoutStore. Modo Escribir muestra el editor/preview normal del libro. Modo Formatear muestra ThemeGallery con el tema activo del proyecto.
  3. Marco de dispositivo en preview: selector Kindle/Impreso/Tablet (visible solo en modo Escribir). DeviceFrame.tsx envuelve el contenido del libro con un marco visual CSS puro (sin dependencias nuevas). Cada dispositivo tiene dimensiones, border-radius, bezel y colores propios.
- Archivos creados:
  - src/components/book/DeviceFrame.tsx (componente de marco de dispositivo, CSS puro)
- Archivos modificados:
  - src/types/layout.ts (tipos BookViewMode, DeviceFrame)
  - src/stores/layoutStore.ts (estado bookViewMode, deviceFrame con setters)
  - src/components/layout/TopTabs.tsx (boton Export con setActiveTab('libro') + setShowExportDialog)
  - src/components/layout/BookTabContent.tsx (toggle Escribir/Formatear, selector de dispositivo, DeviceFrame wrapper, ThemeGallery en modo Formatear)
  - src/i18n/locales/en.json (book.writeMode, book.formatMode, book.deviceFrame.*)
  - src/i18n/locales/es.json (mismas claves en espanol)
  - src/components/layout/TopTabs.test.tsx (mock actualizado con topbar.export)
- Decisiones tomadas:
  - D-193: Export desde tab no-Libro cambia automaticamente al tab Libro antes de abrir el dialog. Evita mover el ExportBookDialog fuera de BookTabContent y mantiene toda la logica de exportacion en un solo lugar.
  - D-194: Selector de dispositivo solo visible en modo Escribir (no en Formatear). En modo Formatear se muestra ThemeGallery sin marco.
  - D-195: Colores del DeviceFrame (bezels, fondos internos) son hardcoded intencionalmente. Representan dispositivos fisicos, no elementos de UI, por lo que no usan design tokens.
- Tests: 409 TS -- todos verdes
- Bugs encontrados: ExportBookDialog solo se renderizaba dentro de BookTabContent (montado condicionalmente). Corregido haciendo que el boton Export cambie al tab Libro antes de abrir el dialog.

### 2026-09-11 - Epic4-S1 - Theme Gallery read-only + preview gap item6 + tests item6/item10
- Que se hizo: Slice 1 del Epic 4 de Theming con 3 sub-tareas:
  1. Theme Gallery read-only en tab Libro: componente ThemeGallery con thumbnails de preview para cada tema built-in. Muestra mini-preview con tipografia, alineacion, indent y drop caps representados visualmente. Badge "Activo" en el tema del proyecto. Se agregaron 2 temas built-in nuevos (Modern Sans, Classic Literary) para que la galeria tenga contenido.
  2. Preview gap de item6 cerrado: BookMarkdown.tsx ahora renderiza correctamente chapterHeading.align en h1 y drop caps via CSS pseudo-element. Se agregaron CSS vars --book-chapter-align y --book-drop-caps a themeToCssVars. BookChapter ahora propaga themeId/themeOverrides a BookMarkdown.
  3. Tests de cobertura: 15 tests nuevos para resolveTheme (temas nuevos, mutabilidad, overrides cross-theme), themeToCssVars (--book-chapter-align, --book-drop-caps, vars de modern-sans), themeToEpubCss (spacing, h1 align left, ornament null, classic-literary full), listBuiltInThemes, getBuiltInTheme.
- Archivos creados:
  - src/components/book/ThemeGallery.tsx (componente de galeria read-only)
- Archivos modificados:
  - src/lib/theme.ts (2 temas built-in: MODERN_SANS, CLASSIC_LITERARY; CSS vars --book-chapter-align, --book-drop-caps)
  - src/lib/theme.test.ts (15 tests nuevos; total 33 tests en el archivo)
  - src/components/book/BookMarkdown.tsx (h1 usa --book-chapter-align; drop caps via CSS class + style tag)
  - src/components/book/BookChapter.tsx (props themeId/themeOverrides propagados a BookMarkdown)
  - src/components/layout/BookTabContent.tsx (ThemeGallery integrado; tema del proyecto propagado a BookChapter)
  - src/i18n/locales/en.json (book.themeGallery.title, book.themeGallery.activeLabel)
  - src/i18n/locales/es.json (mismas claves en espanol)
- Decisiones tomadas:
  - D-190: ThemeGallery es read-only en Slice 1. Seleccion de tema se implementara en Slice 2.
  - D-191: Drop caps en preview usan CSS class + style tag inyectado (::first-letter no se puede hacer inline). Clase scoped book-md-dropcaps.
  - D-192: 2 temas built-in adicionales (modern-sans: sans-serif, sin indent, con spacing; classic-literary: serif, indent 2em, drop caps, ornament ***) para darle contenido visual a la galeria.
- Tests: 409 TS (antes 348 + 18 theme = 366; ahora 348 + 33 theme + 28 otros = 409) -- todos verdes
- Bugs encontrados: ninguno

### 2026-06-05 - F49 - Menu File nativo con Open / New / Close Project
- Qué se hizo: menú de aplicación Tauri 2.x nativo con submenú "File" (Open Project…, New Project…, Close Project). Los ítems del menú emiten eventos Tauri al frontend vía el patrón emit/listen ya existente (igual que terminal.rs/useTerminal.ts). El frontend reutiliza la lógica existente sin duplicar.
- Archivos modificados:
  - src-tauri/src/lib.rs (menú Areyto + File con 3 ítems y aceleradores; on_menu_event emite menu:open-project / menu:new-project / menu:close-project; imports tauri::menu::* + Emitter)
  - src/stores/projectStore.ts (añadidos pendingMenuAction: 'open' | null y setPendingMenuAction — permiten coordinar la acción cuando el menú se dispara con un proyecto ya abierto)
  - src/hooks/useMenuEvents.ts (nuevo hook; listen de 3 eventos; si hay proyecto abierto → setPendingMenuAction + closeProject; si no → triggerOpenProject)
  - src/components/welcome/WelcomeScreen.tsx (useEffect de montaje: lee pendingMenuAction → dispara handleOpen automáticamente al renderizar WelcomeScreen tras closeProject)
  - src/App.tsx (useMenuEvents() añadido junto a useKeyboardShortcuts y useSettingsPersistence)
- Decisiones tomadas:
  - D-186: Labels del menú nativo en inglés fijo ("File", "Open Project…", etc.). Los menús nativos de Tauri no pasan fácilmente por react-i18next (el menú se construye en Rust en tiempo de arranque). i18n del menú nativo = tarea futura aparte.
  - D-187: "Open Project" y "New Project" usan el mismo handler (triggerOpenProject / handleOpen de WelcomeScreen). La distinción open/create la decide la carpeta elegida: si tiene proyecto.json lo abre; si no, muestra CreateProjectModal. Semántica suficiente para F49.
  - D-188: Coordinación menú-con-proyecto-abierto vía pendingMenuAction en el store: closeProject() → WelcomeScreen monta → useEffect lee pendingMenuAction → llama handleOpen. Evita duplicar el dialog logic fuera de WelcomeScreen.
  - D-189: ⌘⇧W sigue funcionando como shortcut de teclado además del menú nativo. closeProject() es idempotente — doble disparo no rompe nada.
- Pendientes relacionados:
  - F50 (siguiente): validación de estructura al abrir proyecto (proyecto.json + 4 carpetas). openProject hoy solo verifica proyecto.json.
- Tests: 348 TS + 41 Rust — todos verdes
- Bugs encontrados: ninguno

### 2026-06-05 - F48 - i18n Fase 6 (cierra i18n al 100%): componentes escapados + 2 gaps
- Qué se hizo: migración de los ~25 strings restantes de UI en componentes no cubiertos por F43-F47. i18n queda al 100%. Incluye plurales (i18next count), interpolaciones, shortcuts, y 2 gaps descubiertos en el audit.
- Archivos modificados:
  - src/i18n/locales/en.json (añadidas claves: common.noProjectOpen, common.chapterCount_one/other, book.loading, book.emptyTitle/Body, book.indice, book.chapterLoadError, book.export.*, editor.edit/preview/noActiveChapter, versions.title/noActiveChapter/noHistory/expandPanel/collapsePanel, finished.title/emptyTitle/emptyBody, sidebar.refreshList/refreshListAria, settings.projects.defaultLanguage.options.*)
  - src/i18n/locales/es.json (mismas claves en español)
  - src/components/layout/BookTabContent.tsx (useTranslation; 10 strings migrados incl. interpolaciones de ruta/error y noProjectOpen)
  - src/components/panels/EditorPanel.tsx (useTranslation en ChapterView y EditorPanel; shortcuts patrón `${t('editor.edit')} (⌘E)`)
  - src/components/book/BookHeader.tsx (useTranslation; plural common.chapterCount)
  - src/components/layout/FinishedTabContent.tsx (useTranslation; noProjectOpen, finished.title, plural chapterCount)
  - src/components/book/BookEmptyState.tsx (useTranslation; book.emptyTitle/emptyBody)
  - src/components/terminados/TerminadosEmptyState.tsx (useTranslation; finished.emptyTitle/emptyBody)
  - src/components/terminal/TerminalView.tsx (useTranslation; common.noProjectOpen)
  - src/components/book/BookChapterError.tsx (useTranslation; book.chapterLoadError con interpolación filename)
  - src/components/sidebar/RefreshChaptersButton.tsx (useTranslation; sidebar.refreshList + shortcut, sidebar.refreshListAria)
  - src/components/versions/CommitList.tsx (useTranslation; versions.noActiveChapter, versions.noHistory)
  - src/components/book/BookIndice.tsx (useTranslation; book.indice)
  - src/components/frontmatter/FrontmatterCopyrightEditor.tsx (licencia inicial → t('common.defaultCopyrightLicense'))
  - src/components/layout/ChapterTabContent.tsx (useTranslation; versions.expandPanel)
  - src/components/panels/VersionsPanel.tsx (useTranslation; versions.title, versions.collapsePanel)
  - src/components/versions/RestoreConfirmModal.tsx (GAP 1: formatDate acepta locale param; usa i18n.language en vez de 'es-ES' hardcodeado)
  - src/components/settings/SettingsTabContent.tsx (GAP 2: LANGUAGE_OPTIONS render usa t('settings.projects.defaultLanguage.options.' + opt.value); UI_LOCALE_OPTIONS sin tocar)
  - src/components/book/BookIndice.test.tsx (vi.mock react-i18next añadido — BookIndice usa useTranslation ahora)
- Decisiones tomadas:
  - D-181: Plurales i18next: claves _one/_other con {{count}} interpolado. Ambos BookHeader y FinishedTabContent comparten common.chapterCount.
  - D-182: Shortcut pattern (establecido en F44): símbolo concatenado FUERA de t(), e.g. `${t('editor.edit')} (⌘E)`.
  - D-183: LANGUAGE_OPTIONS conserva el array con {value, label} pero el label ya no se usa en render — solo el value para construir la clave i18n. El array podría simplificarse a solo values en refactor futuro, pero está fuera de scope F48.
  - D-184: UI_LOCALE_OPTIONS (English/Español en nombre nativo) NO se toca; es intencional que los nombres de idioma de UI se muestren siempre en su nombre nativo.
  - D-185: formatDate en RestoreConfirmModal ahora recibe locale como parámetro (i18n.language) en vez de hardcodear 'es-ES'. Función pura, fácil de testear.
- Pendientes relacionados: ninguno — i18n al 100%
- Tests: 348 TS + 41 Rust — todos verdes
- Bugs encontrados: ninguno

### 2026-06-05 - F47 - i18n Fase 5 (final, scope mínimo): lib/ + App.tsx + consolidación topbar→common
- Qué se hizo: migración de los strings de UI restantes en lib/ y App.tsx, y consolidación de claves duplicadas topbar.saving/saved/saveError → common.*.
- Archivos modificados:
  - src/i18n/locales/en.json (añadidas common.saveError, common.failedToListChapters, common.defaultCopyrightLicense, app.restoreError; eliminadas topbar.saving, topbar.saved, topbar.saveError)
  - src/i18n/locales/es.json (mismos cambios en español)
  - src/components/layout/TopTabs.tsx (t('topbar.saving/saved/saveError') → t('common.saving/saved/saveError'))
  - src/components/layout/TopTabs.test.tsx (mock actualizado a common.saving/saved/saveError)
  - src/App.tsx (useTranslation añadido; "Cargando…" → t('common.loading'); mensaje restore → t('app.restoreError', { path }))
  - src/lib/refresh-chapters.ts (import i18n; 'Failed to list chapters' → i18n.t('common.failedToListChapters'))
  - src/lib/refresh-chapters.test.ts (vi.mock i18n; aserción actualizada a clave i18n)
  - src/lib/yaml-frontmatter.ts (import i18n; 'Todos los derechos reservados' → i18n.t('common.defaultCopyrightLicense'))
  - src/lib/yaml-frontmatter.test.ts (vi.mock i18n; aserción actualizada a clave i18n)
  - src/components/frontmatter/FrontmatterMetadataEditor.test.tsx (vi.mock i18n añadido — dependencia transitiva yaml-frontmatter → i18n)
- Decisiones tomadas:
  - D-178: lib/ usa import directo de i18n (i18n.t()) en vez de hook. Patrón estándar para módulos non-React que necesitan i18n.
  - D-179: Tests de lib/ mockean '@/i18n/i18n' con { t: key => key } y asertan sobre la clave i18n, no la traducción. Más robusto ante cambios de copy.
  - D-180: topbar.saving/saved/saveError consolidados a common.*. topbar queda solo con closeProject y about.
- Pendientes relacionados:
  - **F48 (pendiente)**: ~25 strings escapados de componentes no cubiertos en F43-F47: BookTabContent (flujos de export con interpolación de rutas/errores), EditorPanel (Editar/Previsualizar), BookHeader y FinishedTabContent (plurales capítulo/capítulos), BookEmptyState, TerminadosEmptyState, TerminalView, BookChapterError, RefreshChaptersButton. Contiene PLURALES (capítulo/capítulos → i18next count) e interpolaciones. La i18n NO está 100% completa hasta F48.
- Tests: 348 TS + 41 Rust — todos verdes
- Bugs encontrados: dependencia transitiva yaml-frontmatter → i18n rompía FrontmatterMetadataEditor.test.tsx; resuelto añadiendo vi.mock('@/i18n/i18n') en ese test.

### 2026-05-21 - F0: Foundation Scaffold
- Qué se hizo: clone local del repo, subida de archivos de contexto, scaffold inicial Tauri + React + TS + Tailwind + Zustand + Vitest, configuración de path aliases, estructura de carpetas según architecture.md
- Archivos creados/modificados:
  - agents.md, context/*.md (copiados desde NAS)
  - .gitignore
  - package.json, pnpm-lock.yaml, pnpm-workspace.yaml
  - tsconfig.json, vite.config.ts
  - src/styles/globals.css
  - src/App.tsx, src/main.tsx, src/test-setup.ts
  - src-tauri/* (scaffold completo)
  - src/components/.gitkeep, src/stores/.gitkeep, src/lib/.gitkeep, src/types/.gitkeep
- Decisiones tomadas:
  - D-001: clone local en ~/dev/Writers_Den, NAS solo para proyectos de libros
  - D-002: create-tauri-app con setup manual de Tailwind, Zustand, Vitest
  - D-003: solo deps foundation, librerías específicas se agregan en sus features
  - D-004: scaffold en root del repo, no subfolder
  - D-005: pnpm como package manager (v11.2.2)
  - D-006: Tauri identifier com.jibaroenlaluna.writingide
  - D-007: nombre técnico writing-ide
  - D-008: Tailwind v4 instalado (usa @tailwindcss/vite, no tailwind.config.js; tema via @theme en CSS)
  - D-009: pnpm-workspace.yaml con allowBuilds: esbuild para resolver build scripts bloqueados en pnpm 11
- Pendientes relacionados: ninguno
- Bugs encontrados: ninguno

### 2026-05-21 - Layout de 3 paneles (editor / terminal / versiones)
- Qué se hizo: chasis visual completo de la app. Top bar con 3 tabs, tab Capítulo Activo con 4 paneles redimensionables (sidebar, editor, terminal, versiones), tabs Libro y Terminados con placeholders. Store Zustand de layout. Todos los placeholders vacíos esperando sus features futuras.
- Archivos creados/modificados:
  - src/types/layout.ts (nuevo)
  - src/stores/layoutStore.ts (nuevo)
  - src/stores/layoutStore.test.ts (nuevo)
  - src/components/layout/TopTabs.tsx (nuevo)
  - src/components/layout/ChapterTabContent.tsx (nuevo)
  - src/components/layout/BookTabContent.tsx (nuevo)
  - src/components/layout/FinishedTabContent.tsx (nuevo)
  - src/components/panels/SidebarPanel.tsx (nuevo)
  - src/components/panels/EditorPanel.tsx (nuevo)
  - src/components/panels/TerminalPanel.tsx (nuevo)
  - src/components/panels/VersionsPanel.tsx (nuevo)
  - src/App.tsx (reemplazado)
  - package.json (react-resizable-panels añadido)
- Decisiones tomadas:
  - D-010: persistencia de tamaños de paneles fuera de scope. Vive en memoria con Zustand. La persistencia correcta (archivo JSON local) se construirá en la task Settings respetando architecture.md invariante 6. localStorage queda explícitamente prohibido.
  - D-011: estructura de paneles del tab Capítulo Activo: Group horizontal (Sidebar | Middle | Versions) con Middle siendo Group vertical (Editor / Terminal). Panel versiones colapsable con botón flotante para reexpandir.
  - D-012: react-resizable-panels v4 instaló v4.11.1 (no v2 como decía el spec). API cambió: PanelGroup→Group, PanelResizeHandle→Separator, direction→orientation, onLayout→onLayoutChanged con Layout={[id:string]:number} en vez de number[].
- Pendientes relacionados:
  - Persistencia de tamaños queda para task Settings
  - Atajos de teclado para cambiar tabs (considerar en Polish)
- Bugs encontrados: ninguno

### 2026-05-21 - Editor base sin persistencia (CodeMirror 6)
- Qué se hizo: CodeMirror 6 montado en el panel del editor del tab Capítulo Activo. Markdown syntax highlighting funcional, soft-wrap, fuente serif, tema oscuro custom alineado con CSS variables de ui-context.md. Buffer en memoria con contenido demo. Sin persistencia ni conexión a filesystem.
- Archivos creados/modificados:
  - src/components/editor/ChapterEditor.tsx (nuevo)
  - src/components/editor/editor-theme.ts (nuevo)
  - src/components/editor/demo-content.ts (nuevo)
  - src/components/editor/ChapterEditor.test.tsx (nuevo)
  - src/components/panels/EditorPanel.tsx (reemplazado)
  - package.json (@codemirror/* y @lezer/highlight añadidos)
- Decisiones tomadas:
  - D-013: tema CodeMirror custom desde cero usando CSS variables de ui-context.md. theme-one-dark descartado por paleta incompatible.
  - D-014: contenido demo en español. Cuando se haga i18n del producto se mueve a archivos de locales.
  - D-015: sin números de línea (gutter). Modo escritura prosaica, no modo código.
  - D-016: @lezer/highlight añadido como dependencia directa (es transitiva de @codemirror pero TypeScript la requiere explícita para importar tags).
- Pendientes relacionados:
  - Persistencia a disco queda para la siguiente task (filesystem service + conexión)
  - lib/project-fs.ts pendiente, próxima feature
  - Conexión editor ↔ filesystem queda como task aparte
  - Concepto de "capítulo activo" en el store queda para cuando exista filesystem real
  - Atajos custom (Cmd+B bold, etc) queda para Polish
- Bugs encontrados: ninguno

### 2026-05-21 - Filesystem service (lib/project-fs.ts)
- Qué se hizo: capa de servicio de filesystem que toda la app va a usar para operaciones sobre proyectos de libro. API tipada con Result style. Tauri commands en Rust como thin wrappers para IO crudo. Lógica de negocio (validación, parsing, naming) en TypeScript. Cero cambios en UI.
- Archivos creados/modificados:
  - src/types/project.ts (nuevo)
  - src/lib/project-fs.ts (nuevo)
  - src/lib/project-fs.test.ts (nuevo)
  - src-tauri/src/project_fs.rs (nuevo)
  - src-tauri/src/lib.rs (modificado, registrar commands)
  - src/components/editor/ChapterEditor.test.tsx (import cleanup menor)
- Decisiones tomadas:
  - D-017: estructura de proyecto sigue architecture.md exactamente (frontmatter/, capitulos/, capitulos-terminados/, backmatter/, proyecto.json en root)
  - D-018: validación de "es un proyecto válido" = tiene proyecto.json parseable
  - D-019: API con ProjectResult<T> (discriminated union) en vez de excepciones. Errores tipados como ProjectFsError.
  - D-020: Tauri commands son thin wrappers de IO. Lógica de negocio en TypeScript según architecture.md invariante 5
  - D-021: modelo "abrir carpeta = abrir proyecto" sin carpeta default del sistema
- Pendientes relacionados:
  - Selector de proyecto en UI (task siguiente)
  - Sidebar de capítulos en UI conectado al servicio
  - Conexión editor ↔ servicio para autosave y load
  - File watching para detectar cambios externos
- Bugs encontrados: ninguno

## Decisiones arquitectónicas (acumuladas)
- D-001 a D-009 documentadas arriba en F0
- D-010 a D-012 documentadas arriba en Layout de 3 paneles
- D-013 a D-016 documentadas arriba en Editor base sin persistencia
- D-017 a D-021 documentadas arriba en Filesystem service

### 2026-05-21 - Selector de proyecto (welcome screen + abrir/crear)
- Qué se hizo: primer punto de entrada de la app. Welcome screen cuando no hay proyecto abierto. Flujo unificado "abrir o crear": dialog nativo para carpeta, si tiene proyecto.json se abre, si no se ofrece crear con modal. Estado de proyecto en projectStore. Nombre del proyecto visible en TopTabs con botón para cerrar.
- Archivos creados/modificados:
  - src/stores/projectStore.ts (nuevo)
  - src/stores/projectStore.test.ts (nuevo)
  - src/components/welcome/WelcomeScreen.tsx (nuevo)
  - src/components/welcome/CreateProjectModal.tsx (nuevo)
  - src/App.tsx (modificado, condicional Welcome vs Layout)
  - src/components/layout/TopTabs.tsx (modificado, nombre proyecto + botón cerrar)
  - src-tauri/src/lib.rs (plugin dialog registrado)
  - src-tauri/Cargo.toml (tauri-plugin-dialog añadido)
  - src-tauri/capabilities/default.json (dialog:default permission)
  - package.json (@tauri-apps/plugin-dialog añadido)
- Decisiones tomadas:
  - D-022: createProject no hace git init en esta feature. Queda para task Versioning.
  - D-023: lista de proyectos recientes fuera de scope. Queda para task Settings.
  - D-024: persistencia de último proyecto abierto fuera de scope. App arranca siempre en Welcome.
  - D-025: plugin oficial @tauri-apps/plugin-dialog para dialogs nativos.
  - D-026: estado "no hay proyecto" es el primary state al arrancar. WelcomeScreen es la primera UI.
  - D-027: flujo unificado "abrir o crear" en un solo botón. Si la carpeta no es proyecto, se ofrece crear.
  - D-028: nombre del proyecto visible en TopTabs con botón X sutil para cerrar.
- Pendientes relacionados:
  - Conectar editor al proyecto/capítulo activo (próxima task)
  - Sidebar de capítulos en panel izquierdo
  - git init al crear proyecto (task Versioning)
  - Proyectos recientes y persistencia (task Settings)
- Bugs encontrados: ninguno

## Decisiones arquitectónicas (acumuladas)
- D-001 a D-009 documentadas arriba en F0
- D-010 a D-012 documentadas arriba en Layout de 3 paneles
- D-013 a D-016 documentadas arriba en Editor base sin persistencia
- D-017 a D-021 documentadas arriba en Filesystem service
- D-022 a D-028 documentadas arriba en Selector de proyecto

### 2026-05-21 - Editor conectado al proyecto (autosave + capítulo activo)
- Qué se hizo: cerró la task original "Editor markdown con CodeMirror 6". El editor lee/escribe el capítulo activo del proyecto. Autosave 500ms debounce. Indicador visual de save status. Al abrir proyecto sin capítulos se crea cap-01.md automáticamente.
- Archivos creados/modificados:
  - src/stores/projectStore.ts (extendido con activeChapterPath, activeChapterContent, saveStatus)
  - src/lib/chapter-loader.ts (nuevo)
  - src/lib/chapter-loader.test.ts (nuevo)
  - src/hooks/useAutosave.ts (nuevo)
  - src/hooks/useAutosave.test.ts (nuevo)
  - src/components/welcome/WelcomeScreen.tsx (loadInitialChapter integrado)
  - src/components/welcome/CreateProjectModal.tsx (loadInitialChapter integrado)
  - src/components/panels/EditorPanel.tsx (usa store, autosave, key={path})
  - src/components/layout/TopTabs.tsx (indicador save status)
  - src/stores/projectStore.test.ts (tests extendidos)
- Decisiones tomadas:
  - D-029: si proyecto sin capítulos al abrir, crear cap-01.md placeholder automáticamente
  - D-030: capítulo activo vive en projectStore. Path absoluto en runtime, filename relativo en proyecto.json
  - D-031: autosave con debounce 500ms en hook reusable useAutosave
  - D-032: indicador idle/saving/saved/error en TopTabs con auto-reset a idle después de 2s
  - D-033: editor se rehidrata cuando cambia activeChapterPath vía key={path}. Prepara para sidebar futuro.
- Pendientes relacionados:
  - Sidebar con lista de capítulos para cambiar (próxima task lógica)
  - File watcher para detectar cambios externos de Claude Code/Spiral
  - Botón Cmd+S para save manual (task Polish)
- Bugs encontrados: ninguno

### 2026-05-21 - Sidebar de capítulos
- Qué se hizo: lista de capítulos en el sidebar del tab Capítulo Activo. Click selecciona y editor remonta. Botón + crea capítulo nuevo automáticamente con placeholder y lo activa. Capítulo activo destacado con border-left accent + bg-tertiary. Subset de la task "Panel izquierdo de proyecto": solo capítulos en progreso.
- Archivos creados/modificados:
  - src/stores/projectStore.ts (extendido: chapters, setChapters, addChapter)
  - src/stores/projectStore.test.ts (tests extendidos)
  - src/lib/chapter-loader.ts (retorna allChapters además de activeChapter)
  - src/lib/chapter-loader.test.ts (tests actualizados para nueva API)
  - src/components/welcome/WelcomeScreen.tsx (setChapters integrado)
  - src/components/welcome/CreateProjectModal.tsx (setChapters integrado)
  - src/components/panels/SidebarPanel.tsx (reescrito con lista real)
  - src/components/sidebar/ChapterList.tsx (nuevo)
  - src/components/sidebar/ChapterListItem.tsx (nuevo)
  - src/components/sidebar/NewChapterButton.tsx (nuevo)
- Decisiones tomadas:
  - D-034: sidebar solo muestra capítulos en progreso. Frontmatter, Backmatter, Terminados van a sus tasks.
  - D-035: sin drag-to-reorder. Orden por filename ascendente. Reorder queda para Polish.
  - D-036: sin conteo de palabras. Stats es otra task.
  - D-037: botón + crea capítulo automáticamente sin modal. Título real se edita en el h1 del editor.
- Pendientes relacionados:
  - File watching para refrescar sidebar cuando un capítulo se modifica externamente
  - Frontmatter, backmatter, capítulos terminados (tasks propias)
  - Conteo de palabras (task Stats)
  - Drag-to-reorder, renombrar desde sidebar (Polish)
- Bugs encontrados: ninguno

## Decisiones arquitectónicas (acumuladas)
- D-001 a D-009 documentadas arriba en F0
- D-010 a D-012 documentadas arriba en Layout de 3 paneles
- D-013 a D-016 documentadas arriba en Editor base sin persistencia
- D-017 a D-021 documentadas arriba en Filesystem service
- D-022 a D-028 documentadas arriba en Selector de proyecto
- D-029 a D-033 documentadas arriba en Editor conectado al proyecto
- D-034 a D-037 documentadas arriba en Sidebar de capítulos

### 2026-05-21 - Git versioning automático + Panel de Versiones
- Qué se hizo: cada proyecto tiene su .git/. Al abrir/crear se inicializa silencioso con initial commit. Autosave dispara commit si hay diff real. Panel de Versiones derecha lista commits del capítulo activo con timestamp relativo. Git via Tauri command nativo (Rust std::process::Command). Backend + UI en una task por decisión consciente (D-043).
- Archivos creados/modificados:
  - src-tauri/src/git.rs (nuevo: 6 commands)
  - src-tauri/src/lib.rs (commands registrados)
  - src/types/git.ts (nuevo)
  - src/lib/versioning.ts (nuevo)
  - src/lib/versioning.test.ts (nuevo)
  - src/lib/commit-loader.ts (nuevo)
  - src/stores/projectStore.ts (extendido: commits, setCommits, prependCommit)
  - src/hooks/useAutosave.ts (+projectPath, commit después de save)
  - src/components/welcome/WelcomeScreen.tsx (ensureGitInit + loadCommits)
  - src/components/welcome/CreateProjectModal.tsx (ensureGitInit + loadCommits)
  - src/components/sidebar/ChapterList.tsx (loadCommits al cambiar capítulo)
  - src/components/panels/VersionsPanel.tsx (reescrito con CommitList)
  - src/components/versions/CommitList.tsx (nuevo)
  - src/components/versions/CommitListItem.tsx (nuevo)
- Decisiones tomadas:
  - D-038: git via Tauri command nativo (std::process::Command). Sin simple-git ni isomorphic-git. Coherente con architecture invariante 5.
  - D-039: auto-commit después de cada autosave exitoso. git_has_changes decide si commit o no, respetando architecture invariante 7.
  - D-040: git init silencioso al abrir proyecto sin .git/. Initial commit con estructura existente.
  - D-041: mensaje commit simple "autosave: {filename}". Timestamp guardado por git.
  - D-042: panel Versiones muestra commits del capítulo activo (filtrados por path). Sin diff ni restore en esta task.
  - D-043: excepción consciente a "una feature a la vez". Backend + UI en una task por decisión de producto.
- Pendientes relacionados:
  - Restore de versión anterior (task futura)
  - Diff view entre versiones
  - Branches por capítulo
  - Tags al cerrar capítulo (task Marcar capítulo terminado)
  - Toggle automático vs manual (task Polish)
- Bugs encontrados: ninguno

## Decisiones arquitectónicas (acumuladas)
- D-001 a D-009 documentadas arriba en F0
- D-010 a D-012 documentadas arriba en Layout de 3 paneles
- D-013 a D-016 documentadas arriba en Editor base sin persistencia
- D-017 a D-021 documentadas arriba en Filesystem service
- D-022 a D-028 documentadas arriba en Selector de proyecto
- D-029 a D-033 documentadas arriba en Editor conectado al proyecto
- D-034 a D-037 documentadas arriba en Sidebar de capítulos
- D-038 a D-043 documentadas arriba en Git versioning automático

### 2026-05-21 - Restore de versión anterior
- Qué se hizo: click en commit del panel Versiones abre modal de confirmación. Confirmar ejecuta flush de autosave pendiente, lee contenido del archivo en ese commit con git show, escribe al disco, hace commit "restore: {file} from {shortHash}". Editor remonta con contenido restaurado. Reversible vía historial.
- Archivos creados/modificados:
  - src-tauri/src/git.rs (+git_show_file_at_commit)
  - src/lib/versioning.ts (+readFileAtCommit, +restoreFile, commitChanges acepta customMessage)
  - src/hooks/useAutosave.ts (retorna {flush, syncSaved} con callback-ref pattern)
  - src/stores/projectStore.ts (+editorVersion, +flushAutosave, +syncAutosaveSaved y actions)
  - src/components/panels/EditorPanel.tsx (key={path:editorVersion}, registra flush/syncSaved)
  - src/components/versions/CommitListItem.tsx (isCurrent prop, HEAD deshabilitado)
  - src/components/versions/CommitList.tsx (click handler, modal state, flujo de restore)
  - src/components/versions/RestoreConfirmModal.tsx (nuevo)
- Decisiones tomadas:
  - D-044: modal de confirmación obligatorio. Acción potencialmente destructiva.
  - D-045: flush de autosave pendiente antes del restore. Cero pérdida de trabajo.
  - D-046: restore como commit nuevo, no como reset. Historial conserva todo, reversible.
  - D-047: git show {hash}:{relative-path} para leer contenido histórico sin checkout completo.
- Pendientes relacionados:
  - Diff view side-by-side (task Comparador de versiones)
  - Restore de proyecto completo (no MVP)
  - Restore desde branches (task Branching por capítulo)
- Bugs encontrados: ninguno

## Decisiones arquitectónicas (acumuladas)
- D-001 a D-009 documentadas arriba en F0
- D-010 a D-012 documentadas arriba en Layout de 3 paneles
- D-013 a D-016 documentadas arriba en Editor base sin persistencia
- D-017 a D-021 documentadas arriba en Filesystem service
- D-022 a D-028 documentadas arriba en Selector de proyecto
- D-029 a D-033 documentadas arriba en Editor conectado al proyecto
- D-034 a D-037 documentadas arriba en Sidebar de capítulos
- D-038 a D-043 documentadas arriba en Git versioning automático
- D-044 a D-047 documentadas arriba en Restore de versión anterior

### 2026-05-21 - Tab Libro con vista renderizada
- Qué se hizo: tab Libro lee todos los capítulos in-progress del proyecto activo, los renderiza con react-markdown en vista de lectura tipo libro. Recarga automáticamente al activar el tab. Tema tipográfico custom alineado con ui-context.md. Manejo gracioso de capítulos con error de lectura.
- Archivos creados/modificados:
  - src/types/book.ts (nuevo: BookSection, BookData)
  - src/lib/book-loader.ts (nuevo: loadBook con carga paralela)
  - src/lib/book-loader.test.ts (nuevo: 5 tests)
  - src/components/book/BookHeader.tsx (nuevo)
  - src/components/book/BookChapter.tsx (nuevo: react-markdown con tema custom)
  - src/components/book/BookEmptyState.tsx (nuevo)
  - src/components/book/BookChapterError.tsx (nuevo)
  - src/components/layout/BookTabContent.tsx (reescrito)
- Decisiones tomadas:
  - D-048: react-markdown 10.x instalado (spec asumía 9.x, API compatible). remark-gfm 4.x.
  - D-049: recarga al activar tab via useEffect en activeTab. Sin cache entre visitas (fresco siempre).
  - D-050: capítulos con error de lectura se muestran con placeholder sin bloquear el resto (Promise.all no falla por un error individual).
  - D-051: solo capítulos in-progress. Terminados y frontmatter/backmatter quedan para sus tasks.
- Pendientes relacionados:
  - Frontmatter section (header del libro)
  - Backmatter section
  - Capítulos terminados visibles en el libro
  - Numeración de páginas
  - Export/Print del libro
- Bugs encontrados: ninguno

## Decisiones arquitectónicas (acumuladas)
- D-001 a D-009 documentadas arriba en F0
- D-010 a D-012 documentadas arriba en Layout de 3 paneles
- D-013 a D-016 documentadas arriba en Editor base sin persistencia
- D-017 a D-021 documentadas arriba en Filesystem service
- D-022 a D-028 documentadas arriba en Selector de proyecto
- D-029 a D-033 documentadas arriba en Editor conectado al proyecto
- D-034 a D-037 documentadas arriba en Sidebar de capítulos
- D-038 a D-043 documentadas arriba en Git versioning automático
- D-044 a D-047 documentadas arriba en Restore de versión anterior
- D-048 a D-051 documentadas arriba en Tab Libro con vista renderizada

### 2026-05-21 - Terminal base con xterm.js + portable-pty
- Qué se hizo: terminal embebido en el panel inferior del tab Capítulo Activo. Shell interactivo del usuario ($SHELL -i -l) cargando .zshrc. CWD = root del proyecto activo. Stream pty ↔ xterm vía Tauri events y commands. Resize automático via ResizeObserver + FitAddon. Spawn al abrir proyecto, kill al cerrar.
- Archivos creados/modificados:
  - src-tauri/Cargo.toml (portable-pty 0.9)
  - src-tauri/src/terminal.rs (nuevo: pty_spawn, pty_write, pty_resize, pty_kill)
  - src-tauri/src/lib.rs (PtyState managed, commands registrados)
  - package.json (@xterm/xterm 6.0, @xterm/addon-fit 0.11)
  - src/main.tsx (import @xterm/xterm/css/xterm.css)
  - src/types/terminal.ts (nuevo: TerminalDimensions)
  - src/hooks/useTerminal.ts (nuevo)
  - src/components/terminal/TerminalView.tsx (nuevo)
  - src/components/panels/TerminalPanel.tsx (reescrito)
- Decisiones tomadas:
  - D-052: callback ref (useState para el div) en vez de useRef, para evitar que container sea null en primer render.
  - D-053: portable-pty como crate Rust. Sin alternativas evaluadas.
  - D-054: shell interactivo + login ($SHELL -i -l). Carga .zshrc del usuario para PATH completo.
  - D-055: un solo terminal en esta task. Tabs en task separada.
  - D-056: spawn al abrir proyecto (cwd cambia), kill al cerrar (cwd → null).
  - D-057: stream via Tauri events (pty:output) y commands (input/resize).
  - D-058: TERMINAL_THEME usa hex hardcodeados porque xterm no soporta CSS vars. Excepción documentada.
- Pendientes relacionados:
  - Sistema de tabs en el terminal (task existente)
  - El terminal se reinicia al cambiar de tab (ChapterTabContent se desmonta). Aceptable para MVP, resolver con persistencia del componente en task futura.
  - Webview como tab adicional
  - Atajos de teclado para alternar foco editor/terminal
  - Settings de fuente y tamaño del terminal
- Bugs encontrados: ninguno (registrar post smoke test si aparece algo)

## Decisiones arquitectónicas (acumuladas)
- D-001 a D-009 documentadas arriba en F0
- D-010 a D-012 documentadas arriba en Layout de 3 paneles
- D-013 a D-016 documentadas arriba en Editor base sin persistencia
- D-017 a D-021 documentadas arriba en Filesystem service
- D-022 a D-028 documentadas arriba en Selector de proyecto
- D-029 a D-033 documentadas arriba en Editor conectado al proyecto
- D-034 a D-037 documentadas arriba en Sidebar de capítulos
- D-038 a D-043 documentadas arriba en Git versioning automático
- D-044 a D-047 documentadas arriba en Restore de versión anterior
- D-048 a D-051 documentadas arriba en Tab Libro con vista renderizada
- D-052 a D-058 documentadas arriba en Terminal base con xterm.js + portable-pty

### 2026-05-21 - Marcar capítulo como terminado (cerrar)
- Qué se hizo: botón "Cerrar capítulo activo" en sidebar. Click abre modal de confirmación. Confirmar: flush autosave → tag git cap-XX-final → mover archivo a capitulos-terminados/ → commit "close: cap-XX.md" → activar siguiente capítulo o limpiar activo. Tab Terminados muestra lista simple de capítulos cerrados (nombre, tag, fecha).
- Archivos creados/modificados:
  - src-tauri/src/git.rs (4 commands: git_tag, git_tag_info, git_list_chapter_tags, git_commit_all)
  - src/types/git.ts (TagInfo, TagFailed error kind)
  - src/types/project.ts (ClosedChapter)
  - src/lib/versioning.ts (tagChapter, listChapterTags, commitAll)
  - src/lib/project-fs.ts (closeChapter)
  - src/lib/close-chapter-flow.ts (nuevo: orchestrador)
  - src/lib/closed-chapters-loader.ts (nuevo)
  - src/stores/projectStore.ts (closedChapters, setClosedChapters, clearActiveChapter)
  - src/components/sidebar/CloseChapterButton.tsx (nuevo)
  - src/components/sidebar/CloseChapterModal.tsx (nuevo)
  - src/components/panels/SidebarPanel.tsx (CloseChapterButton añadido)
  - src/components/terminados/TerminadosList.tsx (nuevo)
  - src/components/terminados/TerminadosListItem.tsx (nuevo)
  - src/components/terminados/TerminadosEmptyState.tsx (nuevo)
  - src/components/layout/FinishedTabContent.tsx (reescrito)
- Decisiones tomadas:
  - D-059: botón fijo en sidebar abajo del + Nuevo, visible solo con capítulo activo.
  - D-060: modal de confirmación obligatorio.
  - D-061: tag git cap-XX-final con padding del filename original.
  - D-062: commit "close: cap-XX.md" via git add -A (maneja rename).
  - D-063: tab Terminados con lista simple en esta task. Render markdown completo es task futura.
  - D-064: después de cerrar, activo pasa al siguiente capítulo disponible o null.
- Pendientes relacionados:
  - Reabrir capítulo terminado (task existente)
  - Tab Terminados con render markdown completo (task futura)
  - Botón refresh manual del sidebar (no needed, sidebar se actualiza en estado)
- Bugs encontrados: ninguno

## Decisiones arquitectónicas (acumuladas)
- D-001 a D-009 documentadas arriba en F0
- D-010 a D-012 documentadas arriba en Layout de 3 paneles
- D-013 a D-016 documentadas arriba en Editor base sin persistencia
- D-017 a D-021 documentadas arriba en Filesystem service
- D-022 a D-028 documentadas arriba en Selector de proyecto
- D-029 a D-033 documentadas arriba en Editor conectado al proyecto
- D-034 a D-037 documentadas arriba en Sidebar de capítulos
- D-038 a D-043 documentadas arriba en Git versioning automático
- D-044 a D-047 documentadas arriba en Restore de versión anterior
- D-048 a D-051 documentadas arriba en Tab Libro con vista renderizada
- D-052 a D-058 documentadas arriba en Terminal base con xterm.js + portable-pty
- D-059 a D-064 documentadas arriba en Marcar capítulo como terminado
- Tailwind v4 cambia la configuración respecto a lo descrito en architecture.md: no hay tailwind.config.js, el tema se define con @theme {} en globals.css, el plugin de Vite es @tailwindcss/vite

### 2026-05-21 - Botón de refresh manual del sidebar
- Qué se hizo: icono RefreshCw al lado del header "CAPÍTULOS". Click ejecuta listChapters y actualiza el store con capítulos in-progress. Spin animation durante refresh. Útil cuando algo externo (Claude Code embebido, otros editores) modifica archivos sin que la app se entere. Solución intermedia hasta file watcher automático.
- Archivos creados/modificados:
  - src/lib/refresh-chapters.ts (nuevo)
  - src/lib/refresh-chapters.test.ts (nuevo)
  - src/components/sidebar/RefreshChaptersButton.tsx (nuevo)
  - src/components/panels/SidebarPanel.tsx (header extendido con el botón)
- Decisiones tomadas:
  - D-065: botón en header como icono pequeño (12px), no botón con texto. Pattern estándar del proyecto.
  - D-066: helper refreshChapters() separado y reutilizable cuando llegue file watcher automático.
  - D-067: spin animation con setTimeout 400ms para que el feedback sea visible incluso en operaciones rápidas.
  - D-068: sin keyboard shortcut en esta task. Cmd+R va en task "Atajos de teclado globales".
- Pendientes relacionados:
  - File watcher automático (task de mayor scope, esta es solución intermedia)
  - Cmd+R como shortcut (task "Atajos de teclado globales")
- Bugs encontrados: ninguno

## Decisiones arquitectónicas (acumuladas)
- D-001 a D-009 documentadas arriba en F0
- D-010 a D-012 documentadas arriba en Layout de 3 paneles
- D-013 a D-016 documentadas arriba en Editor base sin persistencia
- D-017 a D-021 documentadas arriba en Filesystem service
- D-022 a D-028 documentadas arriba en Selector de proyecto
- D-029 a D-033 documentadas arriba en Editor conectado al proyecto
- D-034 a D-037 documentadas arriba en Sidebar de capítulos
- D-038 a D-043 documentadas arriba en Git versioning automático
- D-044 a D-047 documentadas arriba en Restore de versión anterior
- D-048 a D-051 documentadas arriba en Tab Libro con vista renderizada
- D-052 a D-058 documentadas arriba en Terminal base con xterm.js + portable-pty
- D-059 a D-064 documentadas arriba en Marcar capítulo como terminado
- D-065 a D-068 documentadas arriba en Botón de refresh manual del sidebar
- D-069 a D-070 documentadas arriba en Deudas resueltas (housekeeping master → main)
- D-072 a D-076 documentadas arriba en Branding - Areyto
- D-077 a D-081 documentadas arriba en Reabrir capítulo terminado
- D-082 a D-085 documentadas arriba en Fix D-079 - Re-cerrar capítulo reabierto
- D-086 a D-090 documentadas arriba en Atajos de teclado globales
- D-091 a D-097 documentadas arriba en Settings persistentes
- D-098 a D-099 documentadas arriba en Diagnosis bug F19
- D-100 a D-102 documentadas arriba en Mejorar contraste tema oscuro
- D-103 a D-104 documentadas arriba en Centrar botón Abrir proyecto
- D-105 a D-112 documentadas arriba en F22 Toggle vista Markdown / Normal en editor
- D-113 a D-120 documentadas arriba en F23 Export del libro completo a markdown
- D-121 documentada arriba en F23-fix Bugs filtro en-progreso y orden Ambos
- D-122 a D-127 documentadas arriba en F24 Editor de frontmatter estructurado
- D-128 a D-133 documentadas arriba en F25 Editores de Dedicatoria y Agradecimientos
- D-134 a D-141 documentadas arriba en F26 Export markdown completo
- D-142 a D-144 documentadas arriba en F27 Copyright fantasma en tab Libro
- D-154 a D-161 documentadas arriba en F29 Editor de metadata del libro

### 2026-05-26 - F31 - Settings infraestructura + auto-commit toggle (V1)
- Qué se hizo: Tab "Ajustes" nuevo en la nav (último, ⌘4). Campo `auto_commit: bool` (default true) agregado a `GlobalSettings` (Rust y TS, infraestructura existente extendida). Store Zustand `settingsStore` con `load()` y `setAutoCommit()` que persiste inmediatamente. Carga al arranque en `App.tsx`. `useSettingsPersistence` incluye `autoCommit` en sus writes globales. `useAutosave` respeta el flag: si false, guarda el archivo en disco pero no dispara commit Git; si settings no cargado todavía (loaded=false), trata como true para no perder commits durante el arranque.
- Archivos creados:
  - src/stores/settingsStore.ts
  - src/stores/settingsStore.test.ts (6 tests)
  - src/components/settings/SettingsTabContent.tsx
- Archivos modificados:
  - src-tauri/src/settings.rs (campo auto_commit con #[serde(default = "default_auto_commit")] → true; fix JSON corrupto cae a defaults; 3 tests nuevos)
  - src/lib/settings.ts (autoCommit?: boolean en GlobalSettings)
  - src/lib/settings.test.ts (4 tests nuevos)
  - src/types/layout.ts (Tab += 'ajustes')
  - src/components/layout/TopTabs.tsx (tab Ajustes ⌘4 al final)
  - src/App.tsx (settingsStore.load() al arrancar)
  - src/hooks/useSettingsPersistence.ts (autoCommit en writes globales)
  - src/hooks/useAutosave.ts (verifica autoCommit antes de commitear)
  - src/hooks/useAutosave.test.ts (3 tests de integración)
- Decisiones tomadas:
  - D-172: Settings globales por usuario. Extender `GlobalSettings` existente en vez de crear struct UserSettings paralelo (la infraestructura ya existe; duplicar sin ganancia).
  - D-173: UI como tab nuevo en la nav (Ajustes ⌘4). Mismo patrón que tabs existentes, no ventana separada.
  - D-174: V1 implementa infraestructura + 1 setting (autoCommit). Otros settings (tema, fuentes, idioma default, intervalo autosave, carpeta export) quedan como deuda visible para tareas XS futuras que se enchufen a la misma maquinaria.
  - D-175: Schema versionado desde el inicio ({version:1, ...}). Cambios futuros migran v1 → v2 sin perder defaults.
  - D-176: Defaults seguros. autoCommit=true preserva comportamiento previo. Settings null durante arranque se trata como true. No se pierde commit en la transición.
  - D-177: Frontend decide skip-commit, Rust no cambia. El command Rust de commit sigue ejecutando cuando se invoca. Rust agnóstico de preferencias de usuario.
- Pendientes relacionados:
  - F-futura XS: setting intervalo de autosave (250ms/500ms/1s/2s/5s)
  - F-futura M: setting tema (claro/oscuro/auto-sistema) con CSS variables
  - F-futura S: setting fuente del editor (familia + tamaño)
  - F-futura S: setting fuente del tab Libro
  - F-futura S: setting idioma default proyectos nuevos (override del 'en' hardcoded de F29)
  - F-futura S: setting carpeta default Save As del export
- Tests: 260 TS + 21 Rust
- Bugs encontrados: ninguno

### 2026-05-25 - F30 - Export docx vía pandoc embebido (sidecar)
- Qué se hizo: Botón "Exportar a Word" nuevo en header del tab Libro al lado del Exportar (markdown) existente. Click abre modal `ExportBookDocxDialog` con selector de scope (Solo terminados / Solo en progreso / Ambos). Confirmar dispara Save As con default {proyecto}-YYYY-MM-DD.docx, escribe el archivo invocando pandoc embebido en el bundle vía Tauri sidecar. Binarios pandoc 3.x ARM64 (179MB) e Intel (114MB) agregados al repo bajo git-lfs en `src-tauri/binaries/`, configurados como `externalBin` en `tauri.conf.json`. Capability `shell:allow-execute` con scope al sidecar. Refactor: `build_full_markdown` extraído como helper compartido en Rust entre `export_book_markdown` (F23/F26/F28/F29) y `export_book_docx` (F30), una sola fuente de verdad del orden de secciones del export. Input a pandoc: el mismo .md unificado que F26-F29 generan, incluyendo el bloque pandoc-ready YAML (F29) al inicio que pandoc consume automáticamente para portada y metadata catalográfica del .docx. Smoke test visual aprobado en Pages.
- Archivos creados:
  - src-tauri/binaries/pandoc-aarch64-apple-darwin (179MB, LFS)
  - src-tauri/binaries/pandoc-x86_64-apple-darwin (114MB, LFS)
  - .gitattributes (LFS pattern para los binarios)
  - src/components/book/ExportBookDocxDialog.tsx
  - src/components/book/ExportBookDocxDialog.test.tsx (6 tests)
- Archivos modificados:
  - src-tauri/src/export.rs (build_full_markdown helper extraído; export_book_docx async command con AppHandle + shell sidecar; 2 tests F30: test_export_docx_falla_si_no_hay_contenido pasa real, test_export_docx_basico #[ignore] por requerir runtime Tauri con sidecar)
  - src-tauri/src/lib.rs (tauri_plugin_shell::init() + export_book_docx en handler)
  - src-tauri/Cargo.toml + Cargo.lock (tauri-plugin-shell)
  - src-tauri/tauri.conf.json (externalBin: ["binaries/pandoc"])
  - src-tauri/capabilities/default.json (shell:allow-execute sidecar pandoc)
  - src/lib/export-service.ts (exportBookDocx)
  - src/lib/export-service.test.ts (5 tests nuevos)
  - src/components/layout/BookTabContent.tsx (botón Exportar a Word + icono FileText + modal docx)
  - package.json + pnpm-lock.yaml (@tauri-apps/plugin-shell)
- Decisiones tomadas:
  - D-162: Pandoc embebido en el bundle como Tauri sidecar (Opción 1). Out-of-the-box sin instalación adicional.
  - D-163: Binarios separados para macOS Intel + Apple Silicon. No existe universal binary oficial de pandoc.
  - D-164: Sin notarization en V1 (firma ad-hoc local). F futura para distribución pública.
  - D-165: Invocación via Tauri sidecar (AppHandle.shell().sidecar()). Approach canónico de Tauri 2.
  - D-166: Sin reference-doc custom de pandoc. Estilo default profesional.
  - D-167: V1 solo docx. PDF requiere LaTeX, EPUB requiere más metadata. Tasks separadas.
  - D-168: UI 3A: botón separado al lado del Exportar markdown existente.
  - D-169: build_full_markdown helper compartido en Rust. Una sola fuente de verdad del orden del export.
  - D-170: Markdown intermedio se escribe a temp file y se pasa a pandoc como argumento, no stdin. Mejor diagnóstico.
  - D-171: git-lfs para binarios sidecar pandoc. .gitattributes con patrón src-tauri/binaries/*-apple-darwin filter=lfs. 1GB/mes gratis de GitHub.
- Pendientes relacionados:
  - test_export_docx_basico activado cuando exista harness de integración Tauri
  - Notarization del bundle para distribución pública
  - Strippear anchors <a id="cap-XX"></a> antes de pandoc si se ven feos (smoke mostró que no son visibles, deuda no urgente)
- Tests: 247 TS + 18 Rust (1 ignored)
- Bugs encontrados: ninguno

### 2026-05-25 - F29 - Editor de metadata del libro (book details)
- Qué se hizo: editor estructurado nuevo en sidebar (sección FRONTMATTER, item "Detalles") para metadata catalográfica del libro: idioma (default 'en'), descripción, editorial, ISBN, género, fecha de publicación. Archivo nuevo `frontmatter/metadata.yaml` (YAML puro sin delimitadores, no se renderiza visualmente). Export markdown ahora incluye bloque YAML pandoc-ready al inicio del .md, combinando campos de titulo+copyright+metadata con nombres pandoc estándar. Portada visible y resto del export sin cambios. Pre-requisito de export docx (F30 futura).
- Archivos creados/modificados:
  - src/types/frontmatter.ts (MetadataData añadido, FrontmatterKind extendido a 'metadata', FrontmatterData union extendida)
  - src/lib/yaml-frontmatter.ts (parseMetadata, serializeMetadata, defaultMetadata; defaultContent extendido para 'metadata')
  - src/lib/frontmatter-fs.ts (FRONTMATTER_EXT map para extensiones; readMetadata, writeMetadata; ensureFrontmatterFiles crea metadata.yaml con defaults)
  - src/stores/projectStore.ts (ActiveView extendida con 'frontmatter-metadata')
  - src/components/frontmatter/FrontmatterMetadataEditor.tsx (nuevo: idioma con datalist, textarea descripcion, 4 inputs; autosave 500ms)
  - src/components/frontmatter/FrontmatterMetadataEditor.test.tsx (nuevo: 3 tests del componente)
  - src/components/panels/EditorPanel.tsx (caso 'frontmatter-metadata' añadido al switch)
  - src/components/sidebar/FrontmatterSection.tsx (item "Detalles" añadido bajo Dedicatoria)
  - src/lib/export-composer.ts (buildPandocFrontmatterBlock función pura nueva; import yaml)
  - src/lib/export-composer.test.ts (8 tests nuevos para buildPandocFrontmatterBlock)
  - src/lib/export-service.ts (readMetadata en Promise.all; pandocFrontmatterBlock en ExportAdditions; exportBookMarkdown pasa pandocFrontmatterBlock al command)
  - src/lib/export-service.test.ts (mock de readMetadata añadido; pandocFrontmatterBlock:null en 3 assertions de exportBookMarkdown)
  - src/lib/frontmatter-fs.test.ts (readMetadata, writeMetadata tests; ensureFrontmatterFiles actualizado para 4 archivos)
  - src/lib/yaml-frontmatter.test.ts (parseMetadata: 6 tests, serializeMetadata: 4 tests, round-trip: 2 tests)
  - src-tauri/src/export.rs (pandoc_frontmatter: Option<String> como primer parámetro; va al inicio del assembly; 1 test F29 nuevo; todos los tests existentes actualizados con nuevo parámetro)
- Decisiones tomadas:
  - D-154: Modelo C: archivos separados sin duplicación. titulo.md = portada visual. metadata.yaml = catalográfica. Copyright sigue en archivo propio. Export combina los 3 en el bloque pandoc.
  - D-155: Idioma default 'en' alineado con D-004. Usuario lo cambia en segundos si publica en otro idioma.
  - D-156: metadata.yaml es YAML puro, sin delimitadores `---`. Es config para pandoc, no se renderiza visualmente.
  - D-157: Bloque pandoc-ready inyectado al INICIO del export, antes de portada visible. Pandoc lo consume; visualizadores no-pandoc lo muestran como código o lo ignoran.
  - D-158: Nombres de campos en el bloque pandoc usan estándar pandoc/EPUB: title, subtitle, author, date, lang, publisher, identifier, description, subject, rights.
  - D-159: Bloque pandoc omitido si no hay contenido real. Idioma default solo (lang: en) no califica como contenido significativo.
  - D-160: Item "Detalles" en sidebar, bajo Dedicatoria, mismo patrón visual que F24/F25.
  - D-161: Sin render en tab Libro. Metadata es para export profesional, no para presentación al lector.
- Pendientes relacionados:
  - Export docx vía pandoc (F30, Order 23) — ahora tiene el pre-requisito de metadata
  - Smoke test visual de F29 (validar que el archivo metadata.yaml se crea, el editor guarda, el export incluye el bloque)
- Bugs encontrados: test `fechaPublicacion tiene prioridad sobre copyright.ano para date` fallaba por assertion demasiado estricta (año aparece también en rights field). Corregido con regex más preciso.
- Status: Done (pendiente smoke test visual)

### 2026-05-23 - F23: Export del libro completo a markdown unificado
- Qué se hizo: botón "Exportar" (icono Download) en header del tab Libro. Click abre modal ExportBookDialog con 3 radio buttons (Ambos, Solo terminados, Solo en progreso, default Ambos). Confirmar valida que haya archivos, abre dialog nativo Save As (Tauri plugin-dialog) con default {proyecto}-YYYY-MM-DD.md en raíz del proyecto, invoca command Rust que lee, ordena lexicográfico, concatena con '\n\n---\n\n', escribe UTF-8 con newline final. Post-export muestra mensaje nativo con el path resultante. Casos vacíos y cancelaciones manejados sin error ni escritura.
- Archivos creados/modificados:
  - src-tauri/src/export.rs (nuevo: export_book_markdown command + 6 Rust unit tests)
  - src-tauri/src/lib.rs (mod export registrado)
  - src/lib/export-service.ts (nuevo: exportBookMarkdown + countExportableFiles)
  - src/lib/export-service.test.ts (nuevo: 8 tests)
  - src/components/book/ExportBookDialog.tsx (nuevo: modal 3 radios)
  - src/components/book/ExportBookDialog.test.tsx (nuevo: 6 tests)
  - src/components/layout/BookTabContent.tsx (refactor: header + export flow)
- Decisiones tomadas:
  - D-113: Trigger único = botón Download en header del tab Libro. Sin atajo de teclado en esta task.
  - D-114: Dialog de contenido con 3 opciones radio, default "Ambos".
  - D-115: Separador entre capítulos '\n\n---\n\n'. Cada capítulo se trim_end_matches('\n') antes del join para separador limpio.
  - D-116: Orden lexicográfico por filename dentro de cada grupo. En "Ambos", terminados primero, en progreso después (collect llamado en ese orden).
  - D-117: Destino = dialog nativo Tauri Save As (plugin-dialog save()) con defaultPath {proyecto}-YYYY-MM-DD.md en raíz. Null si el usuario cancela.
  - D-118: UTF-8 con newline final (output.push('\n') después del join).
  - D-119: Cancelar el dialog de contenido o el Save As cierra sin error ni escritura. exportLoading protege el botón durante el flujo.
  - D-120: Notificación post-export via message() nativo de plugin-dialog. No se inventó sistema de toast — se usó el dialog nativo per spec.
- Pendientes relacionados:
  - Export a docx/pdf (Order 23 y Order 31 en Notion, tasks separadas)
  - Frontmatter del libro en el export (depende de F19 frontmatter editor)
  - Atajo de teclado ⌘⇧E (si el uso frecuente lo justifica)
- Bugs encontrados: tests Rust con process::id() compartían directorio en parallel — corregido con AtomicUsize counter por test. Smoke test reveló dos bugs adicionales cerrados en F23-fix (ver abajo).

### 2026-05-24 - F25 - Editores de Dedicatoria y Agradecimientos
- Qué se hizo: editores de markdown libre para frontmatter/dedicatoria.md y backmatter/agradecimientos.md. Sección BACKMATTER nueva en sidebar debajo de CAPÍTULOS. Click en "Dedicatoria" o "Agradecimientos" abre CodeMirror directamente (reutilizando ChapterEditor). Autosave 500ms debounced + git commit por archivo. Al abrir proyecto, ensureFrontmatterFiles crea dedicatoria.md vacío; ensureBackmatterFiles (nuevo) crea backmatter/agradecimientos.md vacío. Tab Libro muestra dedicatoria centrada en cursiva entre Copyright y primer capítulo, agradecimientos al final con header.
- Archivos creados/modificados:
  - src/types/frontmatter.ts (DedicatoriaData añadido, FrontmatterKind extendido)
  - src/types/backmatter.ts (nuevo: AgradecimientosData, BackmatterData)
  - src/types/book.ts (BookFrontmatter.dedicatoria, BookBackmatter, BookData.backmatter)
  - src/lib/frontmatter-fs.ts (readDedicatoria, writeDedicatoria, ensureFrontmatterFiles extendido para dedicatoria.md)
  - src/lib/frontmatter-fs.test.ts (3 tests nuevos: readDedicatoria, writeDedicatoria, ensureFrontmatterFiles extendido)
  - src/lib/backmatter-fs.ts (nuevo: readAgradecimientos, writeAgradecimientos, ensureBackmatterFiles)
  - src/lib/backmatter-fs.test.ts (nuevo: 5 tests)
  - src/lib/book-loader.ts (carga dedicatoria y agradecimientos en parallel)
  - src/lib/book-loader.test.ts (mocks backmatter-fs, tests extendidos)
  - src/lib/open-project-flow.ts (llama ensureBackmatterFiles)
  - src/stores/projectStore.ts (ActiveView extendido con frontmatter-dedicatoria, backmatter-agradecimientos)
  - src/components/sidebar/FrontmatterItem.tsx (view: NonNullable<ActiveView> para reutilización)
  - src/components/sidebar/FrontmatterSection.tsx (item Dedicatoria añadido)
  - src/components/sidebar/BackmatterSection.tsx (nuevo: sección BACKMATTER con item Agradecimientos)
  - src/components/panels/SidebarPanel.tsx (BackmatterSection añadida)
  - src/components/frontmatter/FrontmatterDedicatoriaEditor.tsx (nuevo: CodeMirror + autosave + commit)
  - src/components/backmatter/BackmatterAgradecimientosEditor.tsx (nuevo: CodeMirror + autosave + commit)
  - src/components/panels/EditorPanel.tsx (2 nuevos casos en el switch de activeView)
  - src/components/book/BookFrontmatterDedicatoria.tsx (nuevo: centrada, cursiva, vacío → no renderiza)
  - src/components/book/BookBackmatterAgradecimientos.tsx (nuevo: header + markdown, vacío → no renderiza)
  - src/components/layout/BookTabContent.tsx (orden: Título → Copyright → Dedicatoria → capítulos → Agradecimientos)
- Decisiones tomadas:
  - D-128: prosa libre con CodeMirror, no form. Markdown plano sin YAML (a diferencia de titulo/copyright).
  - D-129: dedicatoria en frontmatter/, agradecimientos en backmatter/ (sigue architecture.md).
  - D-130: sección BACKMATTER nueva en sidebar debajo de CAPÍTULOS, paralela a FRONTMATTER arriba.
  - D-131: orden libro: Título → Copyright → Dedicatoria → capítulos → Agradecimientos.
  - D-132: ChapterEditor reutilizado directamente (sin MarkdownTextEditor genérico). ChapterEditor ya es paramétrico (initialContent + onChange), sin dependencias específicas de capítulo. Crear un wrapper genérico duplicaría 55 líneas sin ganancia.
  - D-133: ensureFrontmatterFiles extendido (dedicatoria.md) + ensureBackmatterFiles nuevo, ambos idempotentes, crean archivos vacíos si no existen. FrontmatterItem generalizado a NonNullable<ActiveView> para reutilizar en BackmatterSection sin duplicar el componente.
- Pendientes relacionados:
  - TOC auto-generado (F28)
  - Backmatter genérico (bibliografía, notas)
- Bugs encontrados: ninguno

### 2026-05-25 - F28 - Índice auto-generado (TOC) en tab Libro y export
- Qué se hizo: generación automática del índice (TOC) de capítulos. En el tab Libro, nueva sección "Índice" con links de ancla clickeables aparece entre la dedicatoria y los capítulos. Cada capítulo recibe un id DOM basado en el slug del filename. En el export, el índice se inyecta como sección markdown entre portada/dedicatoria y los capítulos, con anchors <a id="slug"></a> antes de cada capítulo para que los links funcionen. Slugs basados en filename-sin-extensión (estables ante cambios de título). Sección omitida si no hay capítulos.
- Archivos creados/modificados:
  - src/lib/export-composer.ts (slugify función pura, IndiceItem interface, buildIndiceSection, re-export extractChapterTitle desde project-fs)
  - src/lib/export-composer.test.ts (17 tests nuevos: extractChapterTitle×5, slugify×7, buildIndiceSection×5 — total 46 tests)
  - src/lib/export-service.ts (ExportAdditions extendida con indiceContent y chapterSlugs; buildExportAdditions acepta opts:ExportOptions, lee capítulos por scope, calcula slugs, construye TOC; exportBookMarkdown pasa los nuevos campos al command; helpers listSortedMdFilenames y readFileContent)
  - src/lib/export-service.test.ts (beforeEach con mockImplementation para list_dir→[]; todas las expectativas de exportBookMarkdown actualizadas con indiceContent:null, chapterSlugs:{}; buildExportAdditions tests actualizados + 4 tests nuevos de TOC; countExportableFiles tests migrados a mockImplementation — total 21 tests)
  - src-tauri/src/export.rs (use std::collections::HashMap; export_book_markdown extendido con indice_content:Option<String> y chapter_slugs:Option<HashMap<String,String>>; assembly lógico [prepend, indice, chapters(+anchors), append]; inyección <a id="slug"></a>\n\n antes de cada capítulo si slug en mapa; 3 tests nuevos F28 — total 16 tests Rust)
  - src/components/book/BookIndice.tsx (nuevo: renderiza sección Índice con links de ancla; null si lista vacía)
  - src/components/book/BookIndice.test.tsx (nuevo: 3 tests)
  - src/components/book/BookChapter.tsx (prop slug?: string añadida; id={slug} en wrapper div)
  - src/components/layout/BookTabContent.tsx (import slugify + BookIndice; tocItems computado desde bookData.sections; BookIndice renderizado después de dedicatoria; slug pasado a BookChapter)
- Decisiones tomadas:
  - D-145: extractChapterTitle re-exportada desde export-composer.ts (re-export de project-fs). Single source of truth, discoverable desde el módulo de export.
  - D-146: slugify: NFD normalize + strip combining diacritical marks + lowercase + non-alphanum removed + spaces→hyphens + dedup hyphens + trim hyphens. Pura, sin side-effects.
  - D-147: buildIndiceSection retorna null si items vacío (no header huérfano).
  - D-148: IndiceItem = {title: string, slug: string}. Título para display, slug para href/id. Separados para estabilidad del enlace ante cambios de título.
  - D-149: Anchor format en export: <a id="slug"></a>\n\n antes del contenido del capítulo. Compatibilidad máxima vs {#slug} (extensión Pandoc).
  - D-150: TOC incluye solo capítulos kind='chapter' (no errors). Errores de lectura de chapter-error no aparecen en el índice.
  - D-151: Slug basado en filename-sin-extensión (D-151). Estable ante cambios de título del capítulo. cap-01.md → cap-01.
  - D-152: Frontend calcula todos los slugs, pasa chapterSlugs:Record<string,string> al command Rust. Rust solo inyecta texto, no tiene lógica de slugification.
  - D-153: Orden en el export: prepend (portada+dedicatoria) → indice → capítulos (con anchors) → append (agradecimientos).
- Pendientes relacionados:
  - TOC con números de página o posición (si se agrega paginación en el futuro)
  - Export a docx/pdf (tasks separadas)
- Bugs encontrados: ninguno
- Status: Done

### 2026-05-25 - F27 - Copyright fantasma en tab Libro: consistencia con D-141
- Qué se hizo: el tab Libro dejaba ver la sección de copyright cuando el único valor era la licencia default ("Todos los derechos reservados") sin año ni titular reales, inconsistente con la lógica que el export implementó en F26 (D-141). Extraída la regla a función pura exportada hasRealCopyright() en export-composer.ts. BookFrontmatterCopyright ahora usa el helper como guard. Una sola fuente de verdad para la regla en export y renderizado visual.
- Archivos creados/modificados:
  - src/lib/export-composer.ts (hasCopyrightContent renombrada a hasRealCopyright y exportada; signature extendida a CopyrightData | null; buildCopyrightLine actualizada para usarla)
  - src/lib/export-composer.test.ts (import de hasRealCopyright añadido; 8 tests nuevos del helper cubren todos los casos incluido D-143)
  - src/components/book/BookFrontmatterCopyright.tsx (guard reemplazado por hasRealCopyright; import añadido)
  - src/components/book/BookFrontmatterCopyright.test.tsx (nuevo: 2 tests del componente — fantasma → null, real → renderiza)
- Decisiones tomadas:
  - D-142: hasRealCopyright extraída a export-composer.ts como función pura exportada. Reutilizada por buildPortadaSection (export) y BookFrontmatterCopyright (tab Libro). Una sola fuente de verdad para la regla del copyright fantasma.
  - D-143: Las notas no cuentan como copyright real. Son metadato auxiliar, no afirmación de copyright. Si ano=null + titular='' + licencia es default, notas no fuerzan el render. Test refleja false en este caso.
  - D-144: FrontmatterCopyrightEditor (UI de edición) NO aplica el helper. Siempre muestra todos los campos para que el usuario pueda llenarlos. El guard aplica solo a UI de presentación (tab Libro) y export.
- Pendientes relacionados: ninguno
- Bugs encontrados: ninguno
- Status: Done

### 2026-05-24 - F26 - Export markdown completo: incluir frontmatter y backmatter
- Qué se hizo: deuda heredada de F23. El export ahora incluye título+copyright como portada (H1+H2+bold autor+italic copyright+italic notas), dedicatoria.md con header "## Dedicatoria" inyectado, y agradecimientos.md con header "## Agradecimientos" inyectado. Orden: portada → dedicatoria → capítulos filtrados → agradecimientos. Separador \n\n---\n\n consistente con F23. Filtro del modal aplica solo a capítulos. Archivos ausentes/vacíos/whitespace-only omitidos silenciosamente. YAML inválido (manejado por yaml-frontmatter.ts existente con try/catch) produce defaults vacíos → portada omitida sin abortar.
- Archivos creados/modificados:
  - src/lib/export-composer.ts (nuevo: buildPortadaSection, buildDedicatoriaSection, buildAgradecimientosSection, SECTION_SEPARATOR — funciones puras sin Tauri)
  - src/lib/export-composer.test.ts (nuevo: 21 tests unitarios puros)
  - src/lib/export-service.ts (buildExportAdditions nueva función; exportBookMarkdown lee frontmatter/backmatter y pasa prependContent/appendContent al command Rust; countExportableFiles sin cambios)
  - src/lib/export-service.test.ts (mocks de frontmatter-fs y backmatter-fs añadidos; 4 tests exportBookMarkdown actualizados con nuevos params; 2 tests nuevos; 5 tests buildExportAdditions nuevos; 6 tests countExportableFiles sin cambios)
  - src-tauri/src/export.rs (export_book_markdown extendido con prepend_content: Option<String> y append_content: Option<String>; assembly lógico [prepend, chapters, append].filter(nonEmpty).join(sep); error si todo vacío; helper export_simple en tests; 5 tests nuevos F26)
  - src/components/layout/BookTabContent.tsx (eliminado check count===0 y import de countExportableFiles — el Rust command maneja el caso "sin contenido")
- Decisiones tomadas:
  - D-134: Export incluye frontmatter y backmatter, no solo capítulos.
  - D-135: Headers inyectados por el export. # {título} para portada, ## Dedicatoria, ## Agradecimientos. Independientes del contenido escrito por el usuario.
  - D-136-bis: Copyright renderizado desde los 4 campos estructurados de CopyrightData (ano, titular, licencia, notas). Formato: _© {ano} {titular}. {licencia}._ en cursiva. Notas en línea separada también en cursiva. Línea copyright omitida si ano=null + titular='' + (licencia='' o licencia='Todos los derechos reservados').
  - D-137: Frontmatter y backmatter siempre incluidos, ignoran el filtro del modal F23. El filtro aplica solo a capítulos.
  - D-138: Orden final: portada → dedicatoria → capítulos filtrados → agradecimientos. Mismo separador \n\n---\n\n que F23.
  - D-139: Archivos vacíos o ausentes se omiten silenciosamente. YAML inválido omite portada sin abortar. Copyright vacío con título válido renderiza solo # {title}. notas whitespace-only omitida.
  - D-140-bis: Frontend (export-service.ts) prepara prependContent y appendContent como strings o null usando funciones puras de export-composer.ts. El command Rust recibe ambos como Option<String> y solo ensambla + escribe. Lógica de formato completamente en TypeScript.
  - D-141: Portada incluye subtítulo (H2) si existe, autor (bold) si no vacío, además de titulo (H1) y copyright. Orden: H1 → H2 → autor → copyright → notas.
- Pendientes relacionados:
  - F27: TOC auto-generado
  - Export a docx/pdf (tasks separadas, orden Notion 23/31)
  - Frontmatter en el export de backmatter genérico (bibliografía)
- Bugs encontrados: ninguno
- Status: Done

### 2026-05-24 - F24 - Editor de frontmatter estructurado (título + copyright)
- Qué se hizo: sección FRONTMATTER en sidebar con dos ítems clickeables (Título y autor, Copyright). Click en ítem activa un formulario estructurado en el panel editor (en vez del CodeMirror). Los formularios autosaven con debounce 500ms via writeTitulo/writeCopyright a `frontmatter/titulo.md` y `frontmatter/copyright.md` (YAML con delimitadores ---). Al abrir proyecto, ensureFrontmatterFiles crea los archivos si no existen. Tab Libro usa BookFrontmatterTitle (título, subtítulo, autor centrados) en vez de BookHeader si hay datos, y muestra BookFrontmatterCopyright al pie si hay copyright definido. js-yaml para parse/serialize.
- Archivos creados/modificados:
  - package.json (js-yaml 4.1.1 + @types/js-yaml 4.0.9)
  - src/types/frontmatter.ts (nuevo: FrontmatterKind, TituloData, CopyrightData, FrontmatterData)
  - src/types/book.ts (BookFrontmatter añadido, BookData.frontmatter)
  - src/lib/yaml-frontmatter.ts (nuevo: parseTitulo, parseCopyright, serializeTitulo, serializeCopyright, defaults)
  - src/lib/yaml-frontmatter.test.ts (nuevo: 17 tests)
  - src/lib/frontmatter-fs.ts (nuevo: readTitulo, readCopyright, writeTitulo, writeCopyright, ensureFrontmatterFiles)
  - src/lib/frontmatter-fs.test.ts (nuevo: 9 tests)
  - src/lib/book-loader.ts (lee frontmatter en parallel con chapters via Promise.all)
  - src/lib/book-loader.test.ts (mock frontmatter-fs, 3 tests nuevos)
  - src/lib/open-project-flow.ts (llama ensureFrontmatterFiles tras ensureGitInit)
  - src/stores/projectStore.ts (ActiveView type, activeView field, setActiveView action, setActiveChapter establece activeView='chapter', closeProject resetea a null)
  - src/stores/projectStore.test.ts (beforeEach con activeView, 3 tests nuevos)
  - src/components/sidebar/FrontmatterItem.tsx (nuevo: item clickeable con estilos de active/hover)
  - src/components/sidebar/FrontmatterSection.tsx (nuevo: sección FRONTMATTER con 2 items)
  - src/components/panels/SidebarPanel.tsx (FrontmatterSection encima de Capítulos, divisor border-t)
  - src/components/frontmatter/FrontmatterTituloEditor.tsx (nuevo: formulario título+subtítulo+autor, autosave 500ms)
  - src/components/frontmatter/FrontmatterCopyrightEditor.tsx (nuevo: formulario año+titular+licencia+notas, autosave 500ms)
  - src/components/panels/EditorPanel.tsx (refactor: extrae ChapterView, EditorPanel enruta según activeView)
  - src/components/book/BookFrontmatterTitle.tsx (nuevo: título/subtítulo/autor centrados para tab Libro)
  - src/components/book/BookFrontmatterCopyright.tsx (nuevo: nota de copyright al pie del libro)
  - src/components/layout/BookTabContent.tsx (usa BookFrontmatterTitle si hay titulo, BookFrontmatterCopyright al final)
- Decisiones tomadas:
  - D-122: YAML con delimitadores --- en archivos .md (pandoc/jekyll/hugo standard). Sin frontmatter embedded en capítulos — archivos dedicados en frontmatter/.
  - D-123: formulario estructurado (inputs), no editor de texto libre. Validación mínima (tipo correcto). Sin markdown en frontmatter.
  - D-124: autosave debounce 500ms igual que editor de capítulos. Sin botón de guardar explícito.
  - D-125: ensureFrontmatterFiles al abrir proyecto (no al crear). Crea archivos con defaults vacíos si no existen. No sobreescribe si ya existen.
  - D-126: tab Libro muestra BookFrontmatterTitle en vez de BookHeader si titulo.titulo no está vacío. BookFrontmatterCopyright al pie si titular o licencia están definidos.
  - D-127: activeView en projectStore (no en layoutStore) porque depende del proyecto, no del layout global.
- Pendientes relacionados:
  - Frontmatter en el export markdown (pendiente de F23)
  - Backmatter editor (agradecimientos, bibliografía) — futura feature similar a esta
  - Validación de año (rango razonable) — deuda menor
- Bugs encontrados: tsc rechazó `yaml.load(match[1])` con `string | undefined`. Corregido con guard `match[1] === undefined` antes del load.

### 2026-05-24 - F23-fix - Bugs filtro en-progreso y orden Ambos
- Qué se hizo: investigados los 2 bugs reportados en smoke test de F23. Verificación (2026-05-24): `cargo test export` → 8/8 ok, `vitest run export` → 16/16 ok. La lógica de export.rs ya era correcta desde el commit original (dos colectores separados, terminados primero). El problema era la cobertura de tests, no el código: el test `terminados_antes_que_en_progreso_en_ambos` usaba cap-01 en terminados y cap-02 en en-progreso — los filenames coincidían con el orden esperado, así que un sort global buggy también lo pasaría. Cerrado añadiendo tests de regresión correctos en 71fd5bb.
- Archivos modificados:
  - src-tauri/src/export.rs (tests añadidos: `ambos_terminados_primero_independientemente_del_nombre`, `en_progreso_excluye_terminados`)
  - src/lib/export-service.test.ts (test añadido: `scope en-progreso no llama list_dir en capitulos-terminados`)
- Decisiones tomadas:
  - D-121: diagnóstico de smoke-test-vs-unit-test: el código era correcto pero la suite tenía un falso positivo. Fix = tests correctos, no cambio de lógica.
- Bugs encontrados: ninguno en código. Bug de cobertura de tests, resuelto.
- Status: Done

### 2026-05-22 - Branding - Areyto
- Qué se hizo: rename del nombre técnico "writing-ide-scaffold" al nombre definitivo del producto "Areyto" en todos los config files. Bundle identifier macOS de com.jibaroenlaluna.writingide a com.jibaroenlaluna.areyto. Nombre del crate Rust y del paquete npm renombrados. Window title del macOS muestra "Areyto". Sin cambios visuales (logo, icon, splash quedan en proyecto aparte que Juan maneja).
- Archivos creados/modificados:
  - src-tauri/tauri.conf.json (productName, identifier, window title)
  - src-tauri/Cargo.toml (name del crate y del lib, description, authors)
  - src-tauri/src/main.rs (referencia al lib crate actualizada)
  - package.json (name)
  - index.html (title)
  - README.md (reescrito con párrafo del nombre taíno + atribución JELA LLC)
- Decisiones tomadas:
  - D-072: nombre definitivo del producto "Areyto" (palabra taína, ceremonia de narración). Decisión de marca firme.
  - D-073: bundle identifier com.jibaroenlaluna.areyto.
  - D-074: rename del crate Rust y paquete npm a "areyto". Carpeta del repo (Writers_Den) y nombre en GitHub se mantienen por ahora para no ser disruptivo.
  - D-075: dominios areyto.io (primario), areyto.net y areyto.org (defensivos) registrados. Handles bloqueados en X, GitHub, Instagram, TikTok.
  - D-076: trademark search USPTO no realizado. Juan acepta el riesgo conscientemente y procede con branding antes de validación legal formal.
- Pendientes relacionados:
  - Logo y app icon (.icns) — proyecto aparte de Juan
  - Splash screen
  - About window con info de la app y atribución a Jíbaro en la Luna LLC
  - Renombrar carpeta del repo de Writers_Den a areyto (opcional, disruptivo)
  - Renombrar el repo en GitHub (opcional, disruptivo)
  - Landing page en areyto.io
  - Trademark search USPTO eventual (no urgente)
- Bugs encontrados: ninguno

### 2026-05-22 - Settings persistentes
- Qué se hizo: persistencia automática del último proyecto abierto, último capítulo activo dentro del proyecto, y tamaños de los paneles. Storage en dos lugares: global en ~/Library/Application Support/Areyto/settings.json y per-project en <proyecto>/.areyto/state.json. Al arrancar la app, se muestra "Cargando…" brevemente mientras se restaura la sesión. Si el proyecto guardado ya no existe, WelcomeScreen muestra mensaje informativo. .areyto/ se agrega automáticamente al .gitignore del proyecto.
- Archivos creados/modificados:
  - src-tauri/src/settings.rs (nuevo: 4 Tauri commands)
  - src-tauri/src/lib.rs (mod settings registrado)
  - src/lib/settings.ts (nuevo: wrapper TS — readGlobalSettings, writeGlobalSettings, readProjectState, writeProjectState, pathExists)
  - src/lib/settings.test.ts (nuevo: 6 tests)
  - src/lib/open-project-flow.ts (nuevo: setupProjectInStores + openProjectByPath — extrae lógica de WelcomeScreen)
  - src/hooks/useSettingsPersistence.ts (nuevo: debounced 300ms, persiste project + chapter + panel sizes)
  - src/App.tsx (restore en useEffect al montar, loading state, restoreMessage)
  - src/components/welcome/WelcomeScreen.tsx (prop restoreMessage, usa setupProjectInStores)
- Decisiones tomadas:
  - D-091: settings globales en ~/Library/Application Support/com.jibaroenlaluna.areyto/settings.json (Tauri 2.x usa el bundle identifier, no el productName — path corregido en diagnosis D-098)
  - D-092: estado per-project en <proyecto>/.areyto/state.json
  - D-093: lastProjectPath inexistente muestra mensaje informativo en Welcome (no error crítico)
  - D-094: lastActiveChapterPath inexistente cae al primer capítulo sin error
  - D-095: persistencia debounced 300ms para evitar writes excesivos al arrastrar paneles
  - D-096: schema versioning (version: 1) para futuras migraciones
  - D-097: .areyto/ se agrega automáticamente al .gitignore en primer write
- Nota: panel sizes se almacenan como percentages (igual que el store), no como pixels. El spec usaba pixels pero la impl usa los mismos valores del store para consistencia.
- Pendientes relacionados:
  - Settings UI para preferencias editables (futuro)
  - Persistir tab activo entre sesiones (deuda menor, consciente)
  - Scroll position del editor (deuda menor)
- Bugs encontrados: ninguno

### 2026-05-22 - Atajos de teclado globales
- Qué se hizo: 9 atajos globales (⌘S, ⌘N, ⌘⇧T, ⌘R, ⌘1/2/3, ⌘⇧O, ⌘⇧W) con hints visibles en tooltips y al lado de botones. Hook useKeyboardShortcuts montado en App.tsx. Modal abierto bloquea todos los atajos excepto ⌘S (always-on). CloseChapterButton refactorizado a layoutStore para que ⌘⇧T pueda abrir el modal desde cualquier parte. WelcomeScreen registra triggerOpenProject en el store para que ⌘⇧O funcione.
- Archivos creados/modificados:
  - src/lib/keyboard-shortcuts.ts (nuevo: SHORTCUTS, formatShortcut, matchShortcut)
  - src/lib/keyboard-shortcuts.test.ts (nuevo: 6 tests)
  - src/hooks/useKeyboardShortcuts.ts (nuevo: hook global)
  - src/components/shared/ShortcutHint.tsx (nuevo: componente reutilizable)
  - src/types/layout.ts (showCloseChapterModal añadido)
  - src/stores/layoutStore.ts (showCloseChapterModal + setShowCloseChapterModal)
  - src/stores/projectStore.ts (triggerOpenProject + setTriggerOpenProject)
  - src/App.tsx (useKeyboardShortcuts montado)
  - src/components/sidebar/NewChapterButton.tsx (ShortcutHint ⌘N)
  - src/components/sidebar/CloseChapterButton.tsx (refactor a store, ShortcutHint ⌘⇧T)
  - src/components/sidebar/RefreshChaptersButton.tsx (tooltip ⌘R)
  - src/components/layout/TopTabs.tsx (title tooltips en tabs y botón cerrar)
  - src/components/welcome/WelcomeScreen.tsx (triggerOpenProject registrado, ShortcutHint ⌘⇧O)
- Decisiones tomadas:
  - D-086: atajos via useEffect + window.addEventListener. Sin librerías externas.
  - D-087: hints visibles con sintaxis "⌘N", "⌘⇧T" para descubribilidad.
  - D-088: ⌘⇧T para cerrar capítulo (no ⌘W, choca con cerrar ventana macOS).
  - D-089: modal abierto bloquea todos los atajos excepto ⌘S (always-on).
  - D-090: atajos NO personalizables en esta task. Personalización va a Settings (futuro).
- Nota: ⌘R via teclado refresca la lista correctamente pero no activa el spin del icono (el spin es estado local del componente, no del store). Comportamiento aceptable, documentado.
- Pendientes relacionados:
  - Atajos personalizables en Settings (futuro)
  - Modal de ayuda con todos los atajos ⌘? (futuro)
- Bugs encontrados: ninguno

### 2026-05-22 - Fix D-079: Re-cerrar capítulo reabierto
- Qué se hizo: cuando el usuario intenta cerrar un capítulo cuyo tag git ya existe (porque fue cerrado y reabierto antes), el modal detecta el conflicto al montar, calcula el siguiente sufijo incremental disponible (cap-XX-final-2, -3, etc), y le muestra al usuario el tag que se creará. El botón primario cambia a "Crear cap-XX-final-N". Cancelar no tiene efectos secundarios. Tags históricos se mantienen.
- Archivos creados/modificados:
  - src-tauri/src/git.rs (git_tag_exists, git_list_tags_matching — 2 commands nuevos)
  - src-tauri/src/lib.rs (commands registrados)
  - src/lib/versioning.ts (tagExists, findNextAvailableTag; tagChapter extendido con explicitTagName)
  - src/lib/versioning.test.ts (tests extendidos: tagExists, findNextAvailableTag, tagChapter con explicit)
  - src/lib/close-chapter-flow.ts (checkCloseConflict, performCloseChapter con explicitTagName)
  - src/lib/close-chapter-flow.test.ts (nuevo, 5 tests)
  - src/components/sidebar/CloseChapterModal.tsx (checkCloseConflict en useEffect, UI dinámica)
- Decisiones tomadas:
  - D-082: detectar tag existente antes de ejecutar. Sin sobreescritura silenciosa ni error oscuro.
  - D-083: sufijo incremental progresivo (cap-XX-final-2, -3, -N). Escalable a N cierres.
  - D-084: modal detecta conflicto al montar con useEffect. Muestra "Verificando…" hasta resolver. Botón disabled hasta que el check termina.
  - D-085: cancelar no tiene efectos secundarios. El check es read-only.
- Pendientes relacionados: ninguno
- Bugs encontrados: ninguno

### 2026-05-22 - Reabrir capítulo terminado
- Qué se hizo: click en item del tab Terminados abre modal de confirmación. Confirmar mueve archivo de capitulos-terminados/ a capitulos/, hace commit "reopen: cap-XX.md", refresca sidebar y lista de terminados, activa el capítulo reabierto en el editor, cambia tab activo a Capítulo Activo. Tag git cap-XX-final se mantiene intacto como marca histórica.
- Archivos creados/modificados:
  - src/lib/project-fs.ts (reopenChapter helper nuevo, ClosedChapter añadido al import)
  - src/lib/reopen-chapter-flow.ts (nuevo, orquestador)
  - src/lib/reopen-chapter-flow.test.ts (nuevo, 5 tests)
  - src/components/terminados/ReopenChapterModal.tsx (nuevo)
  - src/components/terminados/TerminadosListItem.tsx (clickeable con hover)
  - src/components/terminados/TerminadosList.tsx (maneja modal state, recibe project prop)
  - src/components/layout/FinishedTabContent.tsx (pasa project a TerminadosList)
- Decisiones tomadas:
  - D-077: click en item del tab Terminados abre modal. Patrón consistente con otros modales del proyecto.
  - D-078: tag git cap-XX-final se MANTIENE al reabrir. Marca histórica del momento donde el capítulo estuvo terminado.
  - D-079: re-cerrar un capítulo ya reabierto crea conflicto con tag existente (tag ya existe). Esta task NO maneja ese edge case. Deuda futura.
  - D-080: commit del movimiento como "reopen: cap-XX.md" via commitAll. Mensaje simétrico a "close: cap-XX.md".
  - D-081: después de reabrir, capítulo se activa automáticamente y tab cambia a Capítulo Activo (layoutStore.setActiveTab).
- Pendientes relacionados:
  - Manejar re-cerrar de un capítulo ya reabierto (deuda D-079, tag conflict)
  - Reabrir desde el sidebar (out of scope por decisión UX)
- Bugs encontrados: ninguno

### 2026-05-23 - Centrar botón Abrir proyecto en Welcome
- Qué se hizo: fix visual del botón "Abrir proyecto" en Welcome screen. Aparecía a la izquierda del centro porque el div `flex gap-3` que envolvía botón + ShortcutHint centraba el bloque completo, no el botón solo. Fix: el div contenedor pasa a `relative` (sin flex), el botón queda solo en el flujo normal (el padre `items-center` lo centra por su ancho propio), y el ShortcutHint se posiciona absolute con `left-full` al lado derecho fuera del flujo.
- Archivos modificados:
  - src/components/welcome/WelcomeScreen.tsx (cambio de 2 clases + estructura del hint)
- Decisiones tomadas:
  - D-103: causa raíz del descentrado: ShortcutHint dentro del flex row empujaba el botón a la izquierda del eje central al añadir ancho a la derecha del bloque centrado.
  - D-104: fix con position absolute para el hint (left-full top-1/2 -translate-y-1/2 pl-2). Mantiene el hint visible y alineado verticalmente al botón sin afectar el centrado.
- Pendientes relacionados:
  - Logo en Welcome (proyecto aparte de Juan)
  - Splash screen al arrancar (futuro)
- Bugs encontrados: ninguno

### 2026-05-23 - Mejorar contraste tema oscuro
- Qué se hizo: subir un tono los fondos principales (bg-primary, bg-secondary, bg-tertiary) en globals.css para mejorar legibilidad. Respuesta a feedback directo del usuario: "hay que cambiarle el negro al app casi no se puede leer así" (2026-05-23). También se ajustó bg-editor para mantener la jerarquía visual (editor ≥ primary). Text colors, borders y accents sin cambios. ui-context.md actualizado para reflejar los valores nuevos.
- Archivos modificados:
  - src/styles/globals.css (4 tokens de fondo: bg-primary, bg-secondary, bg-tertiary, bg-editor)
  - context/ui-context.md (valores actualizados para sincronía)
- Decisiones tomadas:
  - D-100: bg-primary #0d0d0f → #18181b, bg-secondary #161618 → #1f1f23, bg-tertiary #1d1d20 → #27272a. Zona zinc-900 de Tailwind. Contraste WCAG con text-primary: 14.6:1, 13.4:1, 12.2:1 respectivamente.
  - D-101: text colors no se tocaron (el problema era el fondo, no el texto). bg-terminal tampoco — los terminales más oscuros siguen siendo intencional.
  - D-102: bg-editor #131316 → #1b1b1f para mantener jerarquía visual (editor queda entre primary y secondary, no más oscuro que primary). Cambio necesario, no scope creep.
- Pendientes relacionados:
  - Sistema de temas con selector (futuro, si decidimos)
  - Botón "Abrir proyecto" no centrado en Welcome (task aparte)
- Bugs encontrados: ninguno

### 2026-05-23 - Diagnosis bug F19 global settings.json
- Qué se hizo: diagnosis del bug detectado en smoke test del viernes 22-may. El smoke test buscó en ~/Library/Application Support/Areyto/ pero Tauri 2.x usa el bundle identifier (com.jibaroenlaluna.areyto) en app_local_data_dir(). El archivo SÍ existe y se escribe correctamente en ~/Library/Application Support/com.jibaroenlaluna.areyto/settings.json — contenido verificado: lastProjectPath correcto, panel sizes correctos. El state.json per-project también correcto (lastActiveChapterPath: capitulos/cap-03.md). Restore verificado via code review del flujo en open-project-flow.ts y filesystem inspection. Ningún cambio de código necesario. D-091 corregido.
- Archivos modificados:
  - context/progress-tracker.md (corrección D-091, entrada de diagnosis)
- Decisiones tomadas:
  - D-098: Tauri 2.x app_local_data_dir() en macOS usa el bundle identifier (com.jibaroenlaluna.areyto), no el productName (Areyto). Path real de global settings: ~/Library/Application Support/com.jibaroenlaluna.areyto/settings.json. Corrección de D-091.
  - D-099: la implementación de F19 (commit 2a5e5ad) era correcta end-to-end. El smoke test del viernes 22-may chequeó el path incorrecto. No se requirió fix de código.
- Pendientes relacionados:
  - F19 oficialmente COMPLETA — restore de proyecto, capítulo activo y tamaños de paneles funcional
- Bugs encontrados: ninguno nuevo

### 2026-05-23 - F22: Toggle vista Markdown / Normal en editor
- Qué se hizo: en el tab Capítulo Activo, el panel del editor ahora tiene un header mínimo con botón icono (Eye/Pencil) y atajo ⌘E para alternar entre el editor CodeMirror y una vista preview renderizada del markdown. El editor se mantiene montado (visibility:hidden) en modo preview para preservar el scroll. La vista preview usa el mismo componente BookMarkdown (maxWidth 900px). El modo se persiste en settings.json global. Se extrajo BookMarkdown como componente compartido usado por BookChapter (tab Libro) y el nuevo preview del editor.
- Archivos creados/modificados:
  - src/types/layout.ts (EditorViewMode type + campo en LayoutState)
  - src/stores/layoutStore.ts (editorViewMode state + setEditorViewMode + toggleEditorViewMode)
  - src/stores/layoutStore.test.ts (4 tests nuevos para editorViewMode)
  - src/lib/settings.ts (editorViewMode?: 'edit' | 'preview' en GlobalSettings)
  - src-tauri/src/settings.rs (editor_view_mode: Option<String> en GlobalSettings)
  - src/hooks/useSettingsPersistence.ts (editorViewMode selector + incluido en persistGlobal + deps)
  - src/App.tsx (restore de editorViewMode en restoreSession)
  - src/lib/keyboard-shortcuts.ts (TOGGLE_EDITOR_VIEW: ⌘E)
  - src/hooks/useKeyboardShortcuts.ts (handler ⌘E con scope check activeTab === 'capitulo')
  - src/components/book/BookMarkdown.tsx (nuevo: componente compartido MD→HTML con maxWidth prop)
  - src/components/book/BookChapter.tsx (refactorizado para usar BookMarkdown maxWidth=700)
  - src/components/panels/EditorPanel.tsx (header con toggle + dual-view editor/preview)
- Decisiones tomadas:
  - D-105: componente BookMarkdown compartido extraído de BookChapter. Single source of truth para el render de markdown. Tab Libro usa maxWidth=700, editor preview usa maxWidth=900.
  - D-106: editor CodeMirror se mantiene montado en modo preview con visibility:hidden + pointer-events:none. Alternativa a unmount/remount para preservar scroll y evitar re-hidratación del editor.
  - D-107: flushAutosave antes del toggle (en handleToggle y en el atajo ⌘E). Garantiza que el contenido del preview es el último guardado.
  - D-108: header del editor siempre visible con toggle (Eye/Pencil), sin ocultar nunca. Muestra ⌘E como ShortcutHint para descubribilidad.
  - D-109: atajo ⌘E con scope check layout.activeTab === 'capitulo'. No toggle si está en tab Libro o Terminados.
  - D-110: editorViewMode persiste en settings.json global (no per-project). El modo de vista es preferencia del usuario, no del proyecto.
  - D-111: restore del modo de vista en restoreSession de App.tsx, con validación estricta ('edit' | 'preview'). Valores corruptos caen al default 'edit'.
  - D-112: layout del EditorPanel: flex-col con header shrink-0 + área de contenido flex-1 min-h-0. El area de contenido usa relative para superponer editor (invisible) y preview (visible) cuando está en modo preview.
- Pendientes relacionados:
  - Shortcut ⌘E podría propagarse a CodeMirror (intercepción nativa). A monitorear.
  - Scroll position del preview no se sincroniza con el editor (no es objetivo del MVP).
- Bugs encontrados: ninguno

## Bugs conocidos
Ninguno actualmente.

### Deudas resueltas
- 2026-05-21: Rama default era `master` en vez de `main`. Resuelto:
  - `src-tauri/src/git.rs` ahora usa `git init --initial-branch=main` (D-069, D-070)
  - Repo del proyecto (Writers_Den) ya estaba en `main` (estaba resuelto antes de esta task)
  - Repo de test-libro renombrado de `master` a `main` con `git branch -m`
  - Proyectos nuevos creados por la app desde ahora usan `main` automáticamente
  - D-069: rama default explícita en el código, no dependemos del config global del usuario
  - D-070: `--initial-branch=main` como flag de `git init`, no como config local post-init

### Bugs resueltos
- 2026-05-21: TerminadosListItem mostraba "Invalid Date". `git_tag_info` y `git_list_chapter_tags` usaban `%(creatordate:iso8601)` que retorna `"2026-05-21 17:04:08 -0700"` (espacio, no T) que JS `new Date()` no parsea. Resuelto cambiando a `iso8601-strict`. Helper `formatRelativeTime` unificado en `src/lib/format-relative-time.ts` — antes duplicado en `CommitListItem` y `TerminadosListItem`. Fix en commit 1c64a7d.
- 2026-05-21: `createChapter` no escribía contenido al disco cuando no se pasaba título explícito. Los capítulos creados vía botón + del sidebar quedaban vacíos, y el sidebar mostraba "cap-02" como fallback al no encontrar h1. Fix en commit be69201: el servicio ahora genera `# Capítulo N\n\n` internamente. `chapter-loader.ts` también simplificado para delegar a `createChapter` (DRY).

## Refactors pendientes
Ninguno.

## Notas para futuras sesiones
- La primera compilación de Rust (cargo) tarda varios minutos en descargar y compilar las dependencias. Las siguientes son rápidas.
- pnpm-workspace.yaml tiene allowBuilds: esbuild — no borrar, es necesario para que Vite funcione.
- Tailwind v4: usar @theme {} para definir tokens, no tailwind.config.js. Clases de Tailwind mapean a --color-* por convención de v4.

### 2026-06-04 - F46: i18n Fase 4 — Welcome + modales + sidebar + AboutDialog
- Commit: (pendiente smoke del arquitecto)
- Qué se hizo: migración de todos los strings visibles de WelcomeScreen, 7 modales (CreateProjectModal, CloseChapterModal, ReopenChapterModal, RestoreConfirmModal, ExportBookDialog, ExportBookDocxDialog, AboutDialog) y los componentes de sidebar (SidebarPanel, FrontmatterSection, BackmatterSection, ChapterList, NewChapterButton, CloseChapterButton).
- Namespaces nuevos en en.json/es.json: `welcome.*` (tagline, dialogTitle, openProject, opening, restoreMessageSuffix, errorOpen, errorLoad), `modal.*` (createProject, closeChapter, reopenChapter, restoreVersion, exportMarkdown, exportDocx, exportScope con subclaves por modal), `sidebar.*` (frontmatter, chapters, backmatter, noProject, noChapters, newChapter, closeChapter, items.titulo/copyright/dedicatoria/metadata/agradecimientos), `about.*` (tagline, company, version, close).
- Componentes migrados: WelcomeScreen, CreateProjectModal, CloseChapterModal, ReopenChapterModal, RestoreConfirmModal, ExportBookDialog, ExportBookDocxDialog, AboutDialog, SidebarPanel, FrontmatterSection, BackmatterSection, ChapterList, NewChapterButton, CloseChapterButton.
- Tests actualizados: AboutDialog.test.tsx, ExportBookDialog.test.tsx, ExportBookDocxDialog.test.tsx, TopTabs.test.tsx (mock react-i18next extendido con claves about.*).
- Nota: AboutDialog tenía strings hardcodeados de F41 (se hizo antes de i18n). Migrados en esta fase.
- Nota: `about.version` usa interpolación i18next: `t('about.version', { version })` — excepción aprobada por arquitecto (valor único al final, sin elementos JSX).
- Nota: `modal.createProject.errorWriteFailed` también usa interpolación i18next: `t('modal.createProject.errorWriteFailed', { reason })` — mismo caso que about.version (valor único en error de texto plano).
- Frases con elementos JSX (strong/code) en CloseChapterModal y ReopenChapterModal: troceadas en Part1/Part2/Part3/Part4 per decisión del arquitecto. NO se usa interpolación i18next para esas.
- Botón Cancelar: clave propia por modal (modal.<nombre>.cancel), no reutiliza common.cancel.
- Sidebar items (Título y autor, Agradecimientos, etc.): claves propias bajo sidebar.items.*, no reutilizan frontmatter.*/backmatter.* (contexto distinto: navegación vs encabezado de editor).
- DEUDA MENOR: frases troceadas Part1/Part2 funcionan bien para en/es pero pueden romperse con idiomas de orden sintáctico distinto (alemán, japonés, árabe). Revisar si se añade un tercer idioma.
- Tests: 347 TS + 41 Rust (sin cambio de conteo).
- Pendientes F47: lib/, App.tsx, limpieza opcional topbar.saving/saved → common.saving/saved.

### 2026-06-04 - F45: i18n Fase 3 — Editores de Frontmatter y Backmatter
- Qué se hizo: migración de los 5 editores de frontmatter/backmatter (~25 strings). Namespace common.* nuevo para los strings repetidos (saving/saved/loading). Refactor de sub-componentes IdiomaField y DescripcionField en FrontmatterMetadataEditor para aceptar label/placeholder como props (consistente con el patrón Field existente).
- Namespaces añadidos: common.* (saving, saved, loading), frontmatter.* (titulo, copyright, metadata, dedicatoria con sus labels/placeholders), backmatter.* (agradecimientos).
- Strings NO traducidos (intencional): placeholder "en" en IdiomaField (código ISO), label "ISBN" (sigla estándar), placeholder "978-0-000-00000-0" (formato técnico), placeholder "2025" (año de ejemplo), placeholder dinámico `new Date().getFullYear()` en CopyrightEditor.
- Coexistencia: topbar.saving/topbar.saved de F44 intactos. Los 5 componentes usan common.saving/common.saved. Limpieza de topbar.* → common.* queda para F47 si se decide.
- Componentes migrados: FrontmatterTituloEditor, FrontmatterCopyrightEditor, FrontmatterMetadataEditor, FrontmatterDedicatoriaEditor, BackmatterAgradecimientosEditor.
- Archivos modificados: src/i18n/locales/en.json, src/i18n/locales/es.json, los 5 componentes, FrontmatterMetadataEditor.test.tsx (mock react-i18next añadido).
- Tests: 347 TS + 41 Rust (sin cambio de conteo; test actualizado para mock expandido).
- Pendientes F46-F47: migrar Welcome/modales/sidebar (F46), lib/, App.tsx y limpieza opcional topbar→common (F47).

### 2026-06-04 - F44: i18n Fase 2 — SettingsTabContent + resto de TopTabs
- Qué se hizo: migración completa de todos los strings visibles de SettingsTabContent (~47 strings) y los 7 strings que quedaron de TopTabs en F43 (STATUS_LABEL × 3 + aria-label/title × 4).
- Namespaces añadidos a en.json/es.json: `settings.*` (title, moreComingSoon + 6 secciones: versioning, editor, appearance, projects, book, export), `topbar.*` (saving, saved, saveError, closeProject, about), `theme.*` (light, dark, auto), `font.*` (serif, inter, sans, mono compartido entre editor y lector).
- Decisiones: THEME_OPTIONS y FONT_FAMILY_OPTIONS simplificados a arrays de valores puros (label eliminado, ahora `t('theme.'+value)` / `t('font.'+value)` en JSX). AUTOSAVE_PRESETS, FONT_SIZE_OPTIONS, LANGUAGE_OPTIONS, UI_LOCALE_OPTIONS mantienen labels hardcoded (unidades universales / nombres nativos de idiomas). `settings.export.sectionTitle` = "Export" en ambos locales (ya estaba en inglés en la UI original). STATUS_LABEL movido de módulo-scope a variable local inside el componente para poder usar `t()`. Shortcut ⌘⇧W concatenado fuera del string traducible per D-194.
- Archivos modificados: src/i18n/locales/en.json, src/i18n/locales/es.json, src/components/settings/SettingsTabContent.tsx, src/components/layout/TopTabs.tsx, src/components/settings/SettingsTabContent.test.tsx, src/components/layout/TopTabs.test.tsx
- Tests: 347 TS + 41 Rust (sin cambio de conteo; tests actualizados para mocks expandidos)
- Pendientes F45-F47: migrar Frontmatter editors, Welcome/modales, sidebar, lib/, App.tsx

### 2026-06-04 - F43: i18n Fase 1 — Infraestructura + piloto TopTabs
- Qué se hizo: infraestructura react-i18next montada. Dos locales (en/es) con recursos JSON inline. uiLocale persistido en GlobalSettings (campo distinto de defaultProjectLanguage que es metadata del libro). TopTabs migrado como componente piloto. Selector "Idioma de la interfaz" nuevo en sección "Interfaz" de SettingsTabContent. Cambio de idioma al instante vía i18n.changeLanguage en setter y en load(). uiLocale incluido en useSettingsPersistence (bug F39 prevenido).
- Dependencias nuevas (aprobadas por arquitecto): react-i18next 17.0.8, i18next 26.3.0 (React 19 compatible)
- Archivos creados:
  - src/i18n/i18n.ts (init i18next con initReactI18next, recursos inline, lng default 'en')
  - src/i18n/locales/en.json (keys: tabs.capitulo/libro/terminados/ajustes + settings.uiLocale.*)
  - src/i18n/locales/es.json (mismas keys en español)
- Archivos modificados:
  - src/main.tsx (import i18n, I18nextProvider wrapping App)
  - src-tauri/src/settings.rs (campo ui_locale: String, serde default "en", 2 tests nuevos)
  - src/lib/settings.ts (uiLocale?: string en GlobalSettings)
  - src/stores/settingsStore.ts (uiLocale state + setUiLocale + changeLanguage en load())
  - src/stores/settingsStore.test.ts (mock i18n, uiLocale en beforeEach, 7 tests nuevos)
  - src/hooks/useSettingsPersistence.ts (uiLocale en objeto + deps)
  - src/hooks/useSettingsPersistence.test.ts (uiLocale en makeSettingsState + 1 test nuevo)
  - src/components/layout/TopTabs.tsx (useTranslation, t('tabs.'+id) sustituye labels hardcoded)
  - src/components/layout/TopTabs.test.tsx (mock react-i18next con traducciones ES)
  - src/components/settings/SettingsTabContent.tsx (useTranslation, UI_LOCALE_OPTIONS, sección Interfaz nueva)
  - src/components/settings/SettingsTabContent.test.tsx (mock react-i18next, uiLocale+setUiLocale en makeState)
  - context/architecture.md (i18n deps aprobadas documentadas, React 19 corregido de "18")
- Decisiones:
  - D-190: react-i18next v17 + i18next v26 como deps aprobadas; versiones compatibles con React 19
  - D-191: uiLocale: String en GlobalSettings, serde default "en". Nombre distinto de defaultProjectLanguage (ese es para metadata.yaml del libro, no la UI)
  - D-192: I18nextProvider en main.tsx envuelve App. i18n.ts importado antes del render como side effect de init
  - D-193: i18n.changeLanguage llamado en load() y setUiLocale() — mismo patrón de side-effect que applyTheme()
  - D-194: TopTabs como único piloto en F43. STATUS_LABEL y todos los demás strings quedan para F44-F47
- Tests: 347 TS + 41 Rust (era 339 TS + 39 Rust antes)
- Pendientes F44-F47: migrar el resto de strings al sistema i18n

### 2026-05-30 - F32: Intervalo de autosave configurable
- Qué se hizo: campo autosave_interval_ms en GlobalSettings (Rust+TS), serde default 500, clamp [500,300000]. settingsStore.setAutosaveIntervalMs persiste inmediato. useAutosave lee del store y re-arma el timer en vivo al cambiar; null -> fallback AUTOSAVE_DELAY_MS=500. Tab Ajustes seccion Editor con dropdown de presets fijos 2/5/15/30s, default visible 2s. Legacy 500 en disco muestra 2s sin warning.
- Archivos: src-tauri/src/settings.rs, src/lib/settings.ts, src/stores/settingsStore.ts, src/hooks/useSettingsPersistence.ts, src/hooks/useAutosave.ts, src/components/settings/SettingsTabContent.tsx, src/components/panels/EditorPanel.tsx (+ tests)
- Tests: 272 TS, 24 Rust (1 ignored)
- Decisiones: D-178 clamp [500,300000]. D-179 presets fijos 2/5/15/30s, piso 2s, no se expone el default crudo. D-180 reactividad del timer en EditorPanel.
- Commit: 396a288
- Smoke: re-arme en vivo validado (2s rafaga vs 30s espera), persistencia OK, dropdown sin 500ms.

### 2026-05-30 - F33: Fix ⌘4 no abría tab Ajustes
- Qué se hizo: TAB_SETTINGS: { key: '4', mod: true } añadido a SHORTCUTS. Handler if (matchShortcut(e, SHORTCUTS.TAB_SETTINGS)) → setActiveTab('ajustes') añadido en useKeyboardShortcuts.ts al mismo nivel que ⌘1/2/3. Test de formatShortcut extendido con TAB_SETTINGS → '⌘4'.
- Archivos: src/lib/keyboard-shortcuts.ts, src/hooks/useKeyboardShortcuts.ts, src/lib/keyboard-shortcuts.test.ts
- Causa: TAB_SETTINGS nunca se añadió a SHORTCUTS en F31 aunque TopTabs.tsx ya mostraba el hint ⌘4. Omisión de registro.
- Tests: 272 TS (sin cambio de conteo; el test nuevo reemplaza línea en suite existente)
- Commit: 2990f44
- tsc: limpio

### 2026-05-30 - F34: Tema claro neutro + sistema de design tokens
- Qué se hizo: virar la app de oscuro a claro neutro (stone palette). Paleta nueva en globals.css (@theme + :root): bg-primary #FAFAF9, bg-secondary #F5F5F4, bg-tertiary #EDECEA, bg-editor #FFFFFF; texto primary #1C1917, secondary #57534E, tertiary #78716C, editor #292524; accent #475569, accent-muted #94A3B8; bordes #E7E5E4/#D6D3D1/#A8A29E; estados: success #16A34A, warning #B45309, error #DC2626, info #2563EB. bg-terminal #0a0a0c sin cambio (D-058). Los 5 modales con backdrop rgba inline pasados a bg-black/60 (Tailwind utility). editor-theme.ts sin cambios de código; los vars CSS actualizan la selección y coloración del editor automáticamente. ui-context.md actualizado. Bug de contraste del panel VERSIONES absorbido: text-text-secondary (#57534E) sobre bg-secondary (#F5F5F4) da 6.9:1, text-text-tertiary (#78716C, stone-500) da ~4.1:1.
- Archivos: src/styles/globals.css, context/ui-context.md, src/components/welcome/CreateProjectModal.tsx, src/components/sidebar/CloseChapterModal.tsx, src/components/versions/RestoreConfirmModal.tsx, src/components/terminados/ReopenChapterModal.tsx, src/components/book/ExportBookDialog.tsx, src/components/book/ExportBookDocxDialog.tsx
- Tests: 272 TS (sin cambio), Rust sin cambio
- Decisiones: D-181 nombres de token existentes mantenidos, valores actualizados (sin renombrar para no romper componentes). D-182 text-tertiary = stone-500 (#78716C) en vez de spec stone-400 (#A8A29E) para WCAG AA en panel VERSIONES (~4.1:1 vs 2.2:1). D-183 accent-muted = slate-400 (#94A3B8): visible como fondo de botón primario (5.4:1) y selección del editor al 50% de opacidad. D-184 backdrops de modales como bg-black/60 en lugar de rgba inline, elimina últimos colores crudos en componentes.
- Commit: 5507d58

### 2026-05-30 - F35: Divisores de panel visibles y agarrables
- Commit: d4be013

### 2026-05-30 - F36: Tipografía UI a Inter (fuente local empaquetada)
- Commit: 61333cb

### 2026-05-31 - F37: Selector de tema claro/oscuro/auto
- Qué se hizo: selector de 3 modos (claro/oscuro/auto) persistido y restaurado. globals.css reorganizado con bloque html[data-theme="dark"] (paleta zinc recuperada de pre-F34). campo themeMode en GlobalSettings (Rust + TS). settingsStore con themeMode + setThemeMode + applyTheme(). Script anti-FOUC en <head> de index.html. Listener prefers-color-scheme para modo auto en App.tsx. Sección "Apariencia" en SettingsTabContent.
- Archivos: src/styles/globals.css, index.html, src/lib/settings.ts, src-tauri/src/settings.rs, src/stores/settingsStore.ts, src/stores/settingsStore.test.ts, src/App.tsx, src/components/settings/SettingsTabContent.tsx, src/components/settings/SettingsTabContent.test.tsx, context/architecture.md
- Tests: 281 TS, 27 Rust
- Decisiones: D-185 data-theme en <html> como selector; CSS vars con dos nombres (--color-* Tailwind + --bg-* directo) sobreescritas en cascada, cero cambios en componentes. D-186 excepción consciente a D-010, aprobada por el arquitecto: localStorage (clave areyto-theme-mode) permitido exclusivamente como caché anti-FOUC leído por el script inline del <head> antes del primer render; settings.json sigue siendo la única fuente de verdad; prohibido para cualquier otro uso. D-187 serde default "light" para theme_mode preserva comportamiento en settings.json existentes. D-188 applyTheme() exportada desde settingsStore, aplica data-theme + escribe localStorage; llamada desde load() y setThemeMode(). D-189 listener prefers-color-scheme en App.tsx useEffect, activo solo cuando themeMode==='auto', limpieza en unmount/cambio.
- Commit: aecdfb1

### 2026-05-31 - F38: Setting de fuente del editor (familia + tamaño)
- Commit: 8fcef11

### 2026-05-31 - F42: Carpeta default de export configurable
- Commit: 82bcdfc
- Qué se hizo: Campo `exportFolder: String` en `GlobalSettings` (Rust serde default `String::new()` vacío; TS `exportFolder?: string`). `settingsStore`: estado `exportFolder` (default `''`), setter `setExportFolder` con read-modify-write, `load()` mapea con `?? ''`. `BookTabContent`: `baseDir = exportFolder || currentProject.rootPath` al construir `defaultPath` para `.md` y `.docx`; tras export exitoso, extrae dirname del `outputPath` elegido por el usuario y llama `setExportFolder` (comportamiento híbrido: fija desde Ajustes + recuerda la última carpeta usada). Sección "Export" en `SettingsTabContent` con display de ruta actual o "Carpeta del proyecto (por defecto)", botón "Examinar…" (`open({ directory: true, multiple: false })`), y botón "Restablecer" (visible solo si hay carpeta configurada, vuelve a `''`). `exportFolder` incluido en `useSettingsPersistence` (objeto hardcodeado + array de deps) para evitar regresión del bug F39. Smoke confirmado: vacío abre en carpeta del proyecto, configurado abre en la carpeta elegida, recuerda la última usada, persiste tras reinicio.
- Archivos modificados: `src-tauri/src/settings.rs`, `src/lib/settings.ts`, `src/stores/settingsStore.ts`, `src/stores/settingsStore.test.ts`, `src/hooks/useSettingsPersistence.ts`, `src/hooks/useSettingsPersistence.test.ts`, `src/components/layout/BookTabContent.tsx`, `src/components/settings/SettingsTabContent.tsx`, `src/components/settings/SettingsTabContent.test.tsx`
- Tests: 339 TS + 39 Rust

### 2026-05-31 - F41: Modal Acerca de Areyto
- Commit: 4df1bd6
- Qué se hizo: Modal "Acerca de Areyto" abierto desde un botón-icono `Info` (14px, lucide-react) en el extremo derecho de `TopTabs`. Estado local `const [showAbout, setShowAbout] = useState(false)` en `TopTabs` — NO toca `layoutStore`. `AboutDialog` nuevo sigue el patrón de modal del proyecto: backdrop `fixed inset-0 z-50 bg-black/60`, panel `bg-bg-tertiary border border-border-default rounded-lg`, cierra con X / Escape / click en backdrop. Contenido: nombre "Areyto", línea descriptiva, "Jíbaro en la Luna LLC", versión `0.1.0` obtenida con `getVersion()` de `@tauri-apps/api/app` (sin comando Rust nuevo, sin permiso extra en capabilities). Smoke confirmado.
- Archivos creados: `src/components/about/AboutDialog.tsx`, `src/components/about/AboutDialog.test.tsx`, `src/components/layout/TopTabs.test.tsx`
- Archivos modificados: `src/components/layout/TopTabs.tsx`
- Tests: 333 TS + 37 Rust. Feature solo-frontend.

### 2026-05-31 - F40: Fuente del tab Libro
- Commit: 22c163b
- Qué se hizo: Campos `bookFontFamily` (default `"serif"`) y `bookFontSize` (default `18`) en `GlobalSettings` Rust + TS. `applyBookFont(family, size)` en `settingsStore` inyecta `--font-book` y `--font-size-book` como inline style en `<html>`, paralelo a `applyEditorFont` de F38. `BookMarkdown.tsx` y `BookFrontmatterTitle.tsx` sustituyen `font-serif` hardcodeado por `var(--font-book)` vía inline style en el contenedor, y los tamaños absolutos por ratios em escalados desde `--font-size-book` (h1=1.78em, h2=1.39em, h3=1.11em, body/p/li=1em). Sección "Libro" en `SettingsTabContent` con dropdown de familia (4 opciones) y tamaño (16/18/20/22px). `bookFontFamily`/`bookFontSize` incluidos en `useSettingsPersistence` para evitar regresión del bug F39. Smoke confirmado: cambio de familia/tamaño del Libro independiente del editor, persiste tras reinicio.
- Archivos modificados: `src-tauri/src/settings.rs`, `src/lib/settings.ts`, `src/stores/settingsStore.ts`, `src/stores/settingsStore.test.ts`, `src/styles/globals.css`, `src/components/book/BookMarkdown.tsx`, `src/components/book/BookFrontmatterTitle.tsx`, `src/components/settings/SettingsTabContent.tsx`, `src/components/settings/SettingsTabContent.test.tsx`, `src/hooks/useSettingsPersistence.ts`, `src/hooks/useSettingsPersistence.test.ts`
- Tests: 317 TS + 37 Rust

### 2026-05-31 - F39: Idioma por defecto de proyectos nuevos
- Commits: `14da0e7` feat(F39) + `9161957` fix(F39 bug useSettingsPersistence)
- Qué se hizo: Campo `defaultProjectLanguage: string` (default `"en"`) en `GlobalSettings` Rust + TS. Estado y setter `setDefaultProjectLanguage` en `settingsStore` (patrón F32: update optimista + persist). `defaultMetadata(lang?)` y `defaultContent(kind, lang?)` aceptan idioma opcional. `ensureFrontmatterFiles(rootPath, lang?)` pasa el idioma al crear `metadata.yaml` de proyectos nuevos. `open-project-flow.ts` lee `defaultProjectLanguage` del store al abrir proyecto. Sección "Proyectos" en `SettingsTabContent` con dropdown de 12 idiomas curados. Smoke confirmado: idioma: es en `metadata.yaml` de proyecto creado con setting 'es'.
- Archivos creados: `src/hooks/useSettingsPersistence.test.ts`
- Archivos modificados: `src-tauri/src/settings.rs`, `src/lib/settings.ts`, `src/stores/settingsStore.ts`, `src/stores/settingsStore.test.ts`, `src/lib/yaml-frontmatter.ts`, `src/lib/frontmatter-fs.ts`, `src/lib/frontmatter-fs.test.ts`, `src/lib/open-project-flow.ts`, `src/components/settings/SettingsTabContent.tsx`, `src/components/settings/SettingsTabContent.test.tsx`, `src/hooks/useSettingsPersistence.ts`
- Tests: 304 TS + 33 Rust

**Bug destapado en smoke:** `useSettingsPersistence.ts` reconstruía `GlobalSettings` con solo 6 campos hardcodeados, sobreescribiendo `defaultProjectLanguage`, `themeMode`, `editorFontFamily`, `editorFontSize` con los defaults de Rust en cada cambio de proyecto o panel. Afectaba F34/F37/F38/F39. Fix: incluir los 4 campos faltantes leídos del store en el objeto y en las dependencias del `useEffect`.

**Bug secundario WebKit:** el `<select>` de 12 opciones no repintaba el label al cambiar el valor (WebKit usa popup scrollable para >4 opciones, que no reacciona a updates de React sin remount). Fix: `key={defaultProjectLanguage}` fuerza remount cuando el valor cambia.

**Deuda técnica — no refactorizar ahora:** `useSettingsPersistence` sigue usando un objeto hardcodeado con todos los campos de `GlobalSettings`. El patrón correcto es read-modify-write: leer el disco con `readGlobalSettings()`, sobreescribir solo los campos que este hook gestiona (`lastProjectPath`, `panels`, `editorViewMode`), y conservar el resto intacto. Con el patrón actual, cualquier setting nuevo que se añada a `GlobalSettings` y se olvide aquí reintroduce el bug. Refactor pendiente cuando se añada el próximo setting de layout.


## Features del branch local (item6/10/7a, F37, F38)

### 2026-08-02 - F37: File watcher automático
- Qué se hizo: detección automática de cambios externos en .md de capitulos/ y capitulos-terminados/. Crate notify (Rust) con watcher.rs (watch_project/unwatch_project + WatcherState managed). Evento Tauri project-files-changed emitido en cada Create/Modify/Remove. Función pura decideReload en lib/watcher-reconcile.ts con 3 decisiones: ignore (eco del autosave), reload (sin ediciones locales), prompt (con ediciones locales). Hook useProjectWatcher con debounce 300ms: refreshChapters siempre + reload/prompt del capítulo activo. Store: lastSavedContent sincronizado en autosave (doSave + syncSaved) y en setActiveChapter; externalChangePending para el banner. Banner ExternalChangeBanner no bloqueante en EditorPanel con botón "Recargar" y X para descartar. Reload usa el mismo mecanismo que el restore de versiones (updateContent + syncAutosaveSaved + incrementEditorVersion).
- Archivos creados:
  - src-tauri/src/watcher.rs (WatcherState, watch_project, unwatch_project)
  - src/lib/watcher-reconcile.ts (decideReload función pura)
  - src/lib/watcher-reconcile.test.ts (4 tests)
  - src/hooks/useProjectWatcher.ts (hook con debounce)
  - src/components/editor/ExternalChangeBanner.tsx (banner no bloqueante)
- Archivos modificados:
  - src-tauri/Cargo.toml (notify 7)
  - src-tauri/src/lib.rs (mod watcher, manage WatcherState, 2 commands)
  - src/stores/projectStore.ts (lastSavedContent, externalChangePending, setters)
  - src/hooks/useAutosave.ts (setLastSavedContent en doSave y syncSaved)
  - src/components/panels/EditorPanel.tsx (ExternalChangeBanner montado)
  - src/App.tsx (useProjectWatcher montado)
- Decisiones tomadas:
  - D-185: watcher vía crate notify + comando Tauri custom + evento Tauri, no polling. Debounce 300ms en el front, no en Rust. Eco suprimido comparando disco contra lastSavedContent.
  - D-186: reload usa el mismo mecanismo que restore de versiones (updateContent + syncAutosaveSaved + incrementEditorVersion). No se inventó camino nuevo.
  - D-187: banner no bloqueante, no modal. El usuario decide si recargar o descartar.
- Pendientes relacionados:
  - Watch de frontmatter/ y backmatter/ (future task)
  - UI de merge/diff 3-way (future task, v1 solo prompt)
  - Reaccionar a operaciones git externas (future task)
- Tests: 279 TS (7 nuevos), Rust sin tests nuevos (thin wrapper)
- Bugs encontrados: ninguno
- Commit: d27503b
- Fix: match del capítulo activo por últimos dos segmentos del path (isSameChapterFile) en vez de igualdad exacta, para que la recarga en vivo dispare en proyectos de iCloud/Synology donde FSEvents reporta el path canónico. Commit d41ef05.

### 2026-08-02 - F38: Importar docx
- Qué se hizo: importar manuscrito .docx, convertir a markdown con pandoc sidecar existente, dividir en capítulos de forma adaptativa, crear proyecto Areyto nuevo y abrirlo. Comando Rust import_docx (pandoc -f docx -t markdown --wrap=none). Función pura splitIntoChapters en lib/split-import.ts: detecta el nivel de encabezado ATX más superficial que se repite >= 2 veces, divide por ese nivel, promueve cada encabezado de capítulo a H1, conserva contenido pre-primer-capítulo como cap-01. Flujo import-docx-flow.ts orquesta pandoc + split + createProject + writeChapter + setupProjectInStores. Botón "Importar de Word (.docx)" en WelcomeScreen + ImportDocxModal (nombre sembrado con filename del docx, selector de carpeta destino).
- Archivos creados:
  - src-tauri/src/import.rs (import_docx command)
  - src/lib/split-import.ts (splitIntoChapters función pura)
  - src/lib/split-import.test.ts (5 tests)
  - src/lib/import-docx-flow.ts (flujo orquestador)
  - src/components/welcome/ImportDocxModal.tsx (modal nombre + carpeta)
- Archivos modificados:
  - src-tauri/src/lib.rs (mod import, import_docx registrado)
  - src/components/welcome/WelcomeScreen.tsx (botón importar + modal)
- Decisiones tomadas:
  - D-188: división de capítulos por el nivel de encabezado ATX más superficial que se repite >= 2 veces. Si ningún nivel se repite, un solo capítulo. Encabezado de capítulo promovido a H1. Contenido pre-primer-capítulo conservado como cap-01.
  - D-189: pandoc --wrap=none para no insertar saltos de línea artificiales en el markdown.
  - D-190: nombre del proyecto sembrado con el filename del docx (sin extensión). Carpeta destino seleccionada por el usuario.
  - D-191: sin dependencias nuevas (pandoc sidecar y tauri-plugin-dialog ya existen).
- Pendientes relacionados:
  - Imágenes/media del docx (v1 es solo texto)
  - Import de frontmatter/metadata del docx a editores de frontmatter
  - Otros formatos (Scrivener, .odt, epub)
  - Split de .md/.txt suelto
- Tests: 284 TS (5 nuevos), Rust sin tests nuevos (thin wrapper)
- Bugs encontrados: ninguno
- Commit: 9607d4d

### 2026-08-08 - F38-fix: Escapes de pandoc en import (-t gfm)
- Qué se hizo: cambiar el writer de pandoc de `-t markdown` a `-t gfm` en import_docx para que el markdown generado no tenga backslashes de escape en apóstrofes, comillas y otros caracteres. GFM sigue emitiendo encabezados ATX (#/##), por lo que splitIntoChapters no se ve afectado.
- Archivos modificados:
  - src-tauri/src/import.rs (línea 17: `-t markdown` → `-t gfm`)
- Decisiones tomadas:
  - D-192: gfm como formato de salida de pandoc para import. Produce markdown limpio sin escapes innecesarios, mantiene encabezados ATX compatibles con el split adaptativo.
- Pendientes relacionados: ninguno
- Tests: 284 TS (sin cambios), cargo check OK, tsc --noEmit limpio
- Bugs encontrados: ninguno

### 2026-08-09 - import-hardening-cloudsync: Endurecer import vs Synology/iCloud
- Qué se hizo: import_docx ahora lee los bytes del .docx en Rust con retry (3 intentos, 250ms entre cada uno) antes de invocar pandoc. Los bytes se escriben a un temp local y pandoc corre sobre ese temp en vez del path original (que puede ser un stub de cloud-sync no hidratado). NotFound corta sin retry; errores transitorios (ESTALE, resource vanished) reintentan y tras 3 fallos dan mensaje accionable mencionando Synology/iCloud. Ambos temps (entrada .docx y salida .md) se limpian al terminar.
- Archivos modificados:
  - src-tauri/src/import.rs (read_docx_bytes helper + temp de entrada + cleanup)
- Decisiones tomadas:
  - D-193: retry 3x con 250ms sleep para errores transitorios de cloud-sync. NotFound es terminal inmediato.
  - D-194: temp de entrada sigue el mismo patrón manual (std::env::temp_dir + pid) que el temp de salida existente. Sin dependencia nueva (no tempfile crate).
- Pendientes relacionados: ninguno
- Tests: 284 TS (sin cambios), cargo check OK, tsc --noEmit limpio
- Bugs encontrados: ninguno

### 2026-08-09 - split-granularidad-dos-niveles: Dividir por capítulo con PARTES como marcador
- Qué se hizo: splitIntoChapters ahora detecta dos niveles de encabezado repetidos (partLevel + chapterLevel). Si hay dos niveles, divide por chapterLevel. Secciones hoja (sin capítulos internos, ej. NOTA DEL AUTOR) producen un capítulo cada una con su encabezado promovido a H1. Secciones parte con capítulos: el primer capítulo de cada parte recibe un marcador bold (**PARTE X**) y la prosa-intro (si hay) antes del H1 promovido. Si solo hay un nivel repetido, comportamiento idéntico al anterior.
- Archivos modificados:
  - src/lib/split-import.ts (heurística de dos niveles, helpers isHeadingAt/headingText/splitAtLevel/promoteHeading/cleanSegment, funciones splitSingleLevel y splitTwoLevels)
  - src/lib/split-import.test.ts (4 tests nuevos, 5 existentes intactos)
- Decisiones tomadas:
  - D-195: partLevel = repeated[0], chapterLevel = repeated[1]. Siempre dividimos por chapterLevel. H3+ no se usan como nivel de split.
  - D-196: marcador de PARTE como bold (**texto**) sin '#', para que no interfiera con el H1 promovido del capítulo.
  - D-197: prosa-intro (contenido entre encabezado de parte y primer capítulo) se conserva en el primer capítulo de la parte, debajo del marcador.
- Pendientes relacionados: ninguno
- Tests: 288 TS (4 nuevos + 284 existentes), tsc --noEmit limpio
- Bugs encontrados: ninguno

### 2026-08-09 - item6-modelo-tema: Modelo de tema de salida + preview cableado
- Qué se hizo: tipo Theme parametrizado (tipografía, heading scale, paragraph indent/spacing/justify, chapter heading, section break, drop caps, measure) en src/lib/theme.ts. Tema built-in JELA Serif como seed. Función resolveTheme (lookup por id con fallback a JELA, deep-merge de overrides). Compilador puro themeToCssVars que genera --book-* custom properties. proyecto.json extendido con campos opcionales tema (id string) y temaOverrides (partial). Backward compat: proyecto viejo sin tema -> JELA. BookMarkdown reescrito para consumir las CSS vars del tema en vez de tamaños/fuentes Tailwind hardcodeados (body, headings, párrafos con sangría+justificación, mono, measure como maxWidthCh).
- Archivos creados:
  - src/lib/theme.ts (Theme type, JELA built-in, resolveTheme, themeToCssVars, DeepPartial, getBuiltInTheme, listBuiltInThemes)
  - src/lib/theme.test.ts (9 tests: resolveTheme fallback/merge/backward-compat, themeToCssVars output)
- Archivos modificados:
  - src/types/project.ts (Project: +tema?, +temaOverrides?)
  - src/lib/project-fs.ts (ProyectoJson: +tema?, +temaOverrides?; updateProjectMeta acepta tema/temaOverrides)
  - src/components/book/BookMarkdown.tsx (consume CSS vars del tema; props themeId/themeOverrides en vez de maxWidth)
  - src/components/panels/EditorPanel.tsx (pasa tema del proyecto a BookMarkdown)
  - src/components/book/BookChapter.tsx (quita maxWidth prop)
  - src/components/book/BookFrontmatterDedicatoria.tsx (quita maxWidth prop)
  - src/components/book/BookBackmatterAgradecimientos.tsx (quita maxWidth prop)
- Decisiones tomadas:
  - D-198: colores NO van en el tema (siguen con tokens stone del ui-context). Theme solo controla tipografía, layout de texto, y ornamentos.
  - D-199: temaOverrides en proyecto.json como Record<string, unknown> para flexibilidad JSON; deepMerge interno maneja el casting.
  - D-200: measure en ch (68ch default JELA) reemplaza maxWidth en px; más fiel a tipografía de libro.
  - D-201: editor-theme.ts (CodeMirror) no se toca; el tema solo aplica al preview y futuro export.
- Pendientes relacionados:
  - Theme builder UI (item 14)
  - Más temas built-in
- Tests: 297 TS (9 nuevos + 288 existentes), tsc --noEmit limpio
- Bugs encontrados: ninguno

### 2026-08-09 - item10-export-epub: Export EPUB con tema aplicado
- Qué se hizo: compilador puro themeToEpubCss(theme) en theme.ts que emite CSS real reader-friendly (body font-size:100%, headings en em, text-indent, justify, section break ornament, drop caps). Comando Rust export_book_epub en export.rs que reusa build_full_markdown, escribe temps .md+.css, corre pandoc -f markdown -t epub --toc --css [--epub-cover-image si hay portada]. Detección de portada por convención (portada/cover .png/.jpg/.jpeg en la raíz). Flujo TS exportBookEpub en export-service.ts: resuelve tema, compila CSS, detecta cover, invoca Rust. Diálogo ExportBookEpubDialog con scope selector. Botón EPUB en BookTabContent junto a Word y Exportar.
- Archivos creados:
  - src/components/book/ExportBookEpubDialog.tsx (diálogo scope para epub)
- Archivos modificados:
  - src/lib/theme.ts (+themeToEpubCss)
  - src/lib/theme.test.ts (+9 tests de themeToEpubCss)
  - src-tauri/src/export.rs (+export_book_epub command)
  - src-tauri/src/lib.rs (+registro export_book_epub)
  - src/lib/export-service.ts (+exportBookEpub, +detectCoverImage, +COVER_FILENAMES)
  - src/components/layout/BookTabContent.tsx (+botón EPUB, +handleExportEpub, +estado epub dialog)
- Decisiones tomadas:
  - D-202: themeToEpubCss usa body font-size:100% (reader-friendly, no fuerza tamaño absoluto); headings en em relativos.
  - D-203: pandoc -t epub con --toc genera ToC navegable automáticamente.
  - D-204: portada por convención de archivo (portada.png/jpg/jpeg, cover.png/jpg/jpeg) en la raíz del proyecto. Sin portada si no existe.
  - D-205: export_book_epub reusa build_full_markdown (no duplica ensamblado).
- Pendientes relacionados:
  - UI para setear/gestionar portada (v1 es por convención de archivo)
  - PDF print (item 11)
  - Más temas built-in
- Tests: 306 TS (9 nuevos themeToEpubCss + 297 existentes), cargo check OK, tsc --noEmit limpio
- Bugs encontrados: ninguno

### 2026-08-09 - item7a-toc-titulos-metadata: ToC con títulos reales, epub sin doble ToC, metadata fallback
- Qué se hizo: función pura deriveExportChapterInfo en export-composer.ts — derivación de título (primer H1, bold-only -> H1, fallback primera línea/filename). buildExportAdditions usa deriveExportChapterInfo y pasa chapterHeadings (mapa de filename -> heading a inyectar) a Rust. Rust build_full_markdown aplica promote_bold_to_heading no destructivamente solo en el ensamblado. EPUB omite ## Índice manual (usa --toc de pandoc para nav nativo). Metadata title cae a proyecto.nombre si titulo.titulo vacío. ExportFormat type pasado por el flujo para condicionar el comportamiento por formato.
- Archivos modificados:
  - src/lib/export-composer.ts (+deriveExportChapterInfo, H1_RE, BOLD_ONLY_RE, ChapterExportInfo; buildPandocFrontmatterBlock acepta projectName? como fallback title)
  - src/lib/export-composer.test.ts (+9 tests: deriveExportChapterInfo 7 + buildPandocFrontmatterBlock fallback 2)
  - src/lib/export-service.ts (+ExportFormat, +chapterHeadings en ExportAdditions, buildExportAdditions usa deriveExportChapterInfo y formato, exportBookMarkdown/Docx/Epub pasan chapterHeadings y projectName)
  - src/lib/export-service.test.ts (ajustar expects para chapterHeadings:{} y nuevo título derivado)
  - src-tauri/src/export.rs (build_full_markdown +chapter_headings param, +promote_bold_to_heading fn; los 3 commands reciben chapter_headings; tests actualizados)
  - src/components/layout/BookTabContent.tsx (pasa currentProject.nombre a los 3 exports)
- Decisiones tomadas:
  - D-206: DRY — título derivado en TS (un solo lugar), Rust solo hace la sustitución mecánica de la primera línea bold-only por el heading provisto.
  - D-207: EPUB no recibe ## Índice manual; usa pandoc --toc para nav nativo (sin doble ToC).
  - D-208: metadata fallback title = proyecto.nombre cuando titulo.titulo vacío (no más UNTITLED).
  - D-209: promote_bold_to_heading es no destructivo (solo en markdown ensamblado, no en .md guardados).
- Pendientes relacionados:
  - item 7b: back matter adicional (Sobre el autor, etc.)
- Tests: 315 TS (9 nuevos + 306 existentes), 24 Rust tests OK, tsc --noEmit limpio
- Bugs encontrados: ninguno
