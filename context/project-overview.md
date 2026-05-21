# Writing IDE - Project Overview

## Qué es
Un editor de escritura por capítulo diseñado para autores que trabajan con CLIs de AI (Claude Code, Spiral) y necesitan versioning automático. Cada capítulo se trabaja en aislamiento con foco completo, y el libro se ensambla visualmente conforme avanzas.

## Para quién
- Autores que escriben libros largos en markdown
- Usuarios de Claude Code, Spiral CLI u otros agentes de AI para edición
- Escritores que quieren versioning sin pensar en git manualmente
- Personas que se bloquean con vistas que muestran demasiado a la vez (ADHD-friendly)

## Flujos core

### Flujo principal: trabajar un capítulo
1. Usuario abre proyecto del libro
2. Selecciona capítulo del sidebar izquierdo
3. Edita en el editor markdown central
4. Invoca CLIs desde el terminal de abajo (Claude Code para edición AI, Spiral para procesamiento literario)
5. Cada save genera commit automático
6. Cuando termina, marca el capítulo como cerrado (git tag)

### Flujo secundario: ver progreso del libro
1. Usuario navega al tab Libro
2. Ve el libro tomando forma con frontmatter, capítulos terminados, backmatter
3. Se motiva para seguir escribiendo

### Flujo terciario: comparar versiones
1. Usuario revisa panel derecho del capítulo activo
2. Ve historial de commits
3. Compara versiones o restaura si necesario

## Los 3 tabs principales
1. Capítulo Activo: editor centro-izquierda, terminal multi-tab abajo, panel versiones derecha colapsable. Foco total en un solo capítulo.
2. Libro: vista tipo libro terminado con tipografía bonita. Ensambla frontmatter + capítulos + backmatter. Área de estímulo creativo.
3. Capítulos Terminados: archivo de los cerrados con su historial accesible.

## Out of scope (NO se construye)
- Colaboración multiusuario en tiempo real
- Sync a la nube (todo es local primero)
- Versión mobile o web
- Editor de PDFs o imágenes
- Sistema de plugins externos
- AI propio embebido (la app se integra con CLIs existentes, no incluye su propio modelo)
- Soporte para formatos que no sean markdown como input

## Criterios de éxito
- Puedo abrir Writing IDE, seleccionar un capítulo y empezar a escribir en menos de 10 segundos
- Claude Code o Spiral pueden modificar el capítulo activo y el editor se refresca sin perder mi trabajo
- El tab Libro me muestra mi libro como se verá terminado
- Nunca pierdo una versión del capítulo, todo está en git automáticamente
- Puedo trabajar 4 horas sin que la app se bloquee o me distraiga
