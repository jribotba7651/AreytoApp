# Writing IDE - Architecture

## Stack
- Framework: Tauri (no Electron, más liviano y arranque rápido)
- UI: React 18 + TypeScript strict
- Styling: Tailwind CSS
- Estado global: Zustand (sin Redux, sin boilerplate)
- Editor: CodeMirror 6 (más liviano que Monaco, mejor para prosa)
- Terminales: xterm.js + portable-pty (Rust side via Tauri)
- Versioning: simple-git (llamadas a git binary) o isomorphic-git si necesitamos cross-platform sin git instalado
- File watching: chokidar o watcher nativo de Tauri
- Webview: Tauri WebviewWindow o iframe
- Markdown rendering (tab Libro): react-markdown con tema custom
- Resizable panels: react-resizable-panels

## Boundaries (separación de capas)

### UI layer (src/components/)
Solo renderiza y dispara eventos. No habla directo con filesystem ni git.

### State layer (src/stores/)
Zustand stores. Manejan estado global de la app: proyecto activo, capítulo activo, configuración de layout, settings.

### Services layer (src/lib/)
La lógica de negocio vive aquí. Filesystem, git, terminal management. Toda interacción con el OS pasa por estos módulos.
- project-fs.ts: lectura y escritura de la estructura del proyecto en disco
- versioning.ts: operaciones git (init, commit, log, restore)
- terminal.ts: spawn y management de ptys
- chapter-state.ts: lógica de cerrar y reabrir capítulos

### Tauri commands (src-tauri/)
Lado Rust. Solo expone comandos que la UI invoca via invoke(). No tiene lógica de negocio, solo el bridge al OS.

## Estructura de carpetas por libro
```
mi-libro/
  proyecto.json          # config: capítulo activo, status, metadata
  frontmatter/
    titulo.md
    copyright.md
    dedicatoria.md
  capitulos/
    cap-01.md            # capítulos en progreso
    cap-02.md
  capitulos-terminados/
    cap-03.md            # se mueven aquí al cerrar
  backmatter/
    agradecimientos.md
  .git/                  # repo git interno al proyecto
```

## Invariantes (reglas que nunca se rompen)

1. El editor nunca escribe directo a disco: siempre pasa por project-fs.ts. Esto permite logging, error handling y test centralizado.

2. Git operations siempre vía versioning.ts: no se llama git desde la UI directamente. Cualquier acción versionable pasa por este módulo.

3. Un capítulo activo a la vez: el estado solo guarda un capítulo abierto. Cambiar de capítulo dispara save + reload, no se mantienen múltiples editores en memoria.

4. El watcher es la fuente de verdad para cambios externos: si Claude Code modifica un archivo, el editor reacciona via watcher, no via polling.

5. Tauri commands son thin wrappers: la lógica vive en TypeScript. Rust solo hace lo que TypeScript no puede (filesystem, pty, dialogs).

6. Settings persisten en archivo JSON local: no en localStorage. La app debe poder migrar entre máquinas copiando el folder de config.

   **Excepción acotada (D-186, aprobada por el arquitecto):** localStorage está permitido únicamente para el caché anti-FOUC de `themeMode` (clave `areyto-theme-mode`), leído por el script inline del `<head>` antes del primer render de React. settings.json sigue siendo la única fuente de verdad para todos los settings. Prohibido para cualquier otro uso.

7. Nunca commitear sin cambios reales: el versioning verifica diff antes de commit para no inflar el log.

## Dónde vive cada cosa (mapa rápido)
- Título del libro: frontmatter/titulo.md (estructurado)
- Capítulo activo (qué archivo): proyecto.json + Zustand store
- Layout de paneles (tamaños): Zustand store, persistido en archivo de config
- Historial de versiones: .git/ del proyecto
- URLs de webviews: archivo de config global de la app (no por proyecto)
- Lista de proyectos recientes: archivo de config global
