# Writing IDE - AI Workflow Rules

Reglas para Claude Code (o cualquier agente AI) trabajando en este proyecto.

## Reglas absolutas

### 1. Lee los 6 archivos de contexto antes de cada feature
Antes de implementar cualquier task, lee en orden:
1. project-overview.md
2. architecture.md
3. code-standards.md
4. ai-workflow-rules.md
5. ui-context.md
6. progress-tracker.md

Si estás implementando una feature específica, lee también su spec file.

### 2. Una feature a la vez
No combinar features no relacionadas en un solo cambio. Si estás implementando Terminal base, no toques el editor markdown aunque veas algo que se podría mejorar. Anótalo y sigue.

### 3. No cruzar boundaries
Si estás trabajando en UI, no escribas lógica de filesystem. Pasa por lib/. Si estás en lib, no importes componentes de React.

### 4. Actualiza progress-tracker.md al terminar
Cada feature completada se añade al tracker con: fecha, qué se hizo, decisiones tomadas durante el build, cosas pendientes.

### 5. No tests para todo
Según code-standards: tests para lib/, no para UI básica.

### 6. Pide clarificación antes de inventar
Si una feature no está clara o entra en conflicto con architecture.md, pregunta. No asumas.

## Reglas de comunicación

- Responder en español (el usuario es Juan, escribe en español)
- No usar em-dashes en respuestas
- Ir al grano, evitar preámbulos
- No bullets innecesarios en conversación normal
- Para reportes de features completadas: sección corta con qué cambió, archivos tocados, decisiones notables

## Reglas de implementación

### Cuando empieces una feature
1. Lee la spec del task en Notion (o el archivo de spec local)
2. Lee los 6 archivos de contexto
3. Lista los archivos que vas a crear o modificar
4. Implementa
5. Verifica el checklist del task
6. Actualiza progress-tracker.md
7. Commit con mensaje descriptivo

### Cuando encuentres un bug existente
- Si está relacionado con la feature actual: arréglalo
- Si no: anótalo en progress-tracker bajo Bugs encontrados y sigue

### Cuando una decisión no esté documentada
- No inventes. Pregunta.
- Cuando se decida, documenta la decisión en architecture.md

### Refactors
- No refactorear por gusto durante una feature
- Si ves algo que necesita refactor, anótalo en progress-tracker
- Los refactors son features separadas con su propio task

## Anti-patterns que evitar

- Sobre-ingeniería: no generalizar para casos que no existen
- Premature optimization: hacer que funcione primero, optimizar si hay problema real
- Magic numbers: constantes con nombre descriptivo
- God components: si un componente hace más de una cosa, dividir
- Inline styles: todo via Tailwind y design tokens
