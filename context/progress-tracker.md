# Writing IDE - Progress Tracker

Este archivo se actualiza con cada feature completada. Es la memoria del proyecto.

## Estado actual
- Fase activa: Polish
- Feature en progreso: ninguna
- Última feature completada: F23 - Export del libro completo a markdown unificado
- Fecha de última actualización: 2026-05-23

## Features completadas

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
