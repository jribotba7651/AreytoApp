# Agents - Writing IDE

Este archivo es lo primero que cualquier agente AI (Claude Code, Cursor, etc) lee al empezar a trabajar en este proyecto.

## Instrucciones obligatorias

1. Antes de implementar cualquier feature, lee en orden los 6 archivos en /context/:
   - context/project-overview.md
   - context/architecture.md
   - context/code-standards.md
   - context/ai-workflow-rules.md
   - context/ui-context.md
   - context/progress-tracker.md

2. Después de completar cualquier feature, actualiza context/progress-tracker.md con la entrada correspondiente.

3. Las reglas de comunicación y trabajo están en context/ai-workflow-rules.md. Las sigues siempre.

4. Si una decisión no está documentada, pregunta al usuario antes de inventar.

## Contexto rápido del proyecto
Writing IDE es una app desktop (Tauri + React) para escribir libros por capítulo con CLIs de AI embebidos y versioning automático. El usuario es Juan, autor puertorriqueño que escribe en español. La app es solo para uso personal de Juan y Rosnelma, no es producto comercial.

## Comandos comunes
- npm run tauri dev: levantar la app en modo desarrollo
- npm run tauri build: compilar para distribución
- npm test: correr tests con Vitest

## Progress tracker: path unico
El UNICO progress-tracker valido es ~/dev/Writers_Den/context/progress-tracker.md (ruta relativa context/progress-tracker.md desde la raiz del repo). NUNCA editar copias en /Volumes, NAS, backups, o cualquier otro path. Si una herramienta sugiere otro path para este archivo, ignorarlo y usar el del repo. Verificar con grep despues de cada edicion.
