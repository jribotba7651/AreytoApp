# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Areyto (internally "Writing IDE") is a Tauri 2 + React 19 + TypeScript desktop app for chapter-based book writing with embedded AI CLIs (Claude Code, Spiral) and per-chapter automatic git versioning. Personal tool for one author (Juan/Rosnelma), not a commercial product. UI strings are in Spanish; code is in English.

## Commands

Package manager is `pnpm` (workspace + lockfile). Use `pnpm`, not `npm`.

- `pnpm tauri dev` — run the desktop app in dev mode (spawns Vite at port 1420, then the Rust shell)
- `pnpm dev` — Vite only, no Tauri shell (rare; most work needs the Rust commands)
- `pnpm build` — `tsc && vite build` (typecheck + bundle the frontend)
- `pnpm tauri build` — produce the distributable app
- `pnpm test` — run Vitest once
- `pnpm test:ui` — Vitest UI
- Single test: `pnpm test src/lib/versioning.test.ts` or `pnpm test -t "crea un commit"` (test names are in Spanish)

Test environment is jsdom with `src/test-setup.ts` as the setup file. `passWithNoTests: true` is set globally.

## Required reading before changes

`Instructions.md` and `agents.md` mandate reading these six files in order before touching code. They define behavior the user expects you to follow:

1. `context/project-overview.md` — the three tabs (Capítulo Activo / Libro / Capítulos Terminados), in-scope flows, explicit out-of-scope list
2. `context/architecture.md` — stack, layer boundaries, project-on-disk layout, the seven invariants
3. `context/code-standards.md` — TS strict rules, naming, 300-line file cap, testing scope
4. `context/ai-workflow-rules.md` — workflow per feature, communication style
5. `context/ui-context.md` — only if the task touches UI
6. `context/progress-tracker.md` — current state, "Up Next" item

After completing a feature, append an entry to `context/progress-tracker.md` (date, files changed, decisions, deferred work, status).

## Architecture

Strict four-layer separation. Crossing layers (e.g. UI calling git directly) is a bug.

- **UI** (`src/components/`) — renders and dispatches; no fs/git access. Folders mirror the three tabs plus shared `editor/`, `terminal/`, `versions/`, `layout/`, `welcome/`.
- **State** (`src/stores/`) — Zustand. `projectStore` (active project, active chapter, chapter lists) and `layoutStore` (panel sizes, persisted to a JSON config file, NOT localStorage).
- **Services** (`src/lib/`) — all business logic. `project-fs.ts` is the only path to disk for app code; `versioning.ts` is the only path to git; `chapter-loader.ts` / `book-loader.ts` / `closed-chapters-loader.ts` read project structure; `close-chapter-flow.ts` orchestrates the "cerrar capítulo" multi-step action; `commit-loader.ts` hydrates the versions panel.
- **Tauri bridge** (`src-tauri/src/`) — thin wrappers only. `project_fs.rs` (read/write/list/rename), `git.rs` (init, commit, log, show, tag — invoked via the `git` binary), `terminal.rs` (portable-pty for embedded CLIs). `lib.rs` registers every command; if you add a Rust command, register it there.

### Invariants that constrain implementation

These come from `architecture.md` and must hold:

1. The editor never writes to disk except through `project-fs.ts`.
2. All git calls go through `versioning.ts`. No raw `git` invocations elsewhere.
3. Only one active chapter in memory at a time. Switching chapters = save + reload, not multi-buffer.
4. External file changes (e.g. Claude Code editing a chapter file) propagate via the file watcher, not polling.
5. Tauri commands are dumb pipes; logic lives in TypeScript.
6. Settings live in a JSON file on disk (portable across machines).
7. Never commit without a real diff — `versioning.ts` checks before committing.

### Per-book on-disk structure

Each book is a folder containing `proyecto.json`, `frontmatter/`, `capitulos/` (in progress), `capitulos-terminados/` (closed), `backmatter/`, and its own `.git/`. Closing a chapter physically moves the file from `capitulos/` to `capitulos-terminados/` and creates a git tag. Never touch user content files (chapter markdown, frontmatter, backmatter) except through the documented flows.

## Hard rules from Instructions.md / code-standards.md

- TypeScript `strict` is on with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `noImplicitOverride`. No `any`; if you need an escape use `unknown` and narrow. No `@ts-ignore` without an in-comment justification.
- No new dependencies without explicit user approval — stop and ask.
- No enums; use string unions (`type Status = 'draft' | 'active' | 'closed'`).
- Max 300 lines per file — split when exceeded.
- Path aliases (`@/components`, `@/lib`, `@/stores`, `@/types`) configured in both `tsconfig.json` and `vite.config.ts`. Use them; no deep relative imports.
- Filenames kebab-case (`project-fs.ts`, `chapter-editor.tsx`); components PascalCase; hooks `useCamelCase`; stores end in `Store`.
- Tests live next to source as `*.test.ts`. Tests required for `src/lib/`, not for basic UI. Test names in Spanish.
- One feature per session — if the user asks for two, push back and propose sequencing. Log unrelated issues in `progress-tracker.md` under "Backlog discovered" rather than fixing them inline.
- Commits: small, atomic, one logical change, present-tense English.
- Communication style: direct, no preamble, no em-dashes. Respond to the user in Spanish.
