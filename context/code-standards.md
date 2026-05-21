# Writing IDE - Code Standards

## TypeScript
- strict: true en tsconfig
- Cero any. Si necesitas escape, usa unknown y narrow con type guards
- Tipos explícitos en funciones públicas, inferencia en internas
- Interfaces para shapes de datos, type aliases para unions y primitives
- No usar enums, usar union de strings: type Status = 'draft' | 'active' | 'closed'

## Naming
- Código en inglés (variables, funciones, archivos)
- UI strings en español (la app es para Juan y Rosnelma)
- Archivos kebab-case: project-fs.ts, chapter-editor.tsx
- Componentes PascalCase: ChapterEditor, VersionsPanel
- Hooks empiezan con use: useActiveChapter, useFileWatcher
- Stores Zustand terminan en Store: projectStore, layoutStore

## React
- Solo componentes funcionales con hooks
- No usar React.FC, declarar props como interface separada
- Custom hooks para lógica reusable, no copiar entre componentes
- Composición sobre prop drilling (Context si pasa 3+ niveles)
- Memo solo cuando hay problema real medido, no preventivo

## Tamaño de archivos
- Máximo 300 líneas por archivo
- Si pasas 300, es señal de que falta separar responsabilidades
- Componentes grandes se dividen en sub-componentes en el mismo folder

## Imports
- Orden: librerías externas, alias internos (@/), relativos, estilos
- Path aliases en tsconfig: @/components, @/lib, @/stores, @/types
- No imports relativos profundos (../../../), usar alias

## Async
- async/await siempre, no chains de .then()
- Errores con try/catch, nunca silenciar (al menos console.error)
- Para errores de UI, mostrar al usuario via toast o modal, no swallowear

## Comentarios
- No comentar el qué (eso lo dice el código)
- Comentar el por qué cuando una decisión no es obvia
- TODO solo con tu nombre y fecha: // TODO(juan, 2026-05): manejar caso de archivo corrupto

## Testing
- No tests para UI básica
- Sí tests para lib/ (filesystem, versioning, terminal)
- Vitest como runner
- Test names en español descriptivo: it('crea un commit cuando hay cambios reales')

## Tailwind
- No clases inline complejas, extraer a componentes
- No colores hardcoded, usar tokens definidos en ui-context.md y configurados en tailwind.config
- Spacing consistente con la escala de Tailwind, no valores arbitrarios
