# Writing IDE - Progress Tracker

Este archivo se actualiza con cada feature completada. Es la memoria del proyecto.

## Estado actual
- Fase activa: MVP Editor
- Feature en progreso: ninguna
- Última feature completada: Filesystem service
- Fecha de última actualización: 2026-05-21

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
- Tailwind v4 cambia la configuración respecto a lo descrito en architecture.md: no hay tailwind.config.js, el tema se define con @theme {} en globals.css, el plugin de Vite es @tailwindcss/vite

## Bugs conocidos
Ninguno.

## Refactors pendientes
Ninguno.

## Notas para futuras sesiones
- La primera compilación de Rust (cargo) tarda varios minutos en descargar y compilar las dependencias. Las siguientes son rápidas.
- pnpm-workspace.yaml tiene allowBuilds: esbuild — no borrar, es necesario para que Vite funcione.
- Tailwind v4: usar @theme {} para definir tokens, no tailwind.config.js. Clases de Tailwind mapean a --color-* por convención de v4.
