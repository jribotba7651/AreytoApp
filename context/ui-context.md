# Writing IDE - UI Context

## Filosofía visual
Editor técnico que respira como un libro. Tema claro neutro (warm stone). Tipografía serif en el área de texto, monospace en terminales, sans-serif en UI chrome. Sin gradientes, sin animaciones excesivas, sin sombras dramáticas. Quieto, enfocado, hermoso. El terminal queda oscuro como excepción deliberada (D-058).

## Tema (Atticus inspired, light palette)

### Colores base
- --bg-primary: #FFFFFF (fondo principal de la app)
- --bg-secondary: #F7F7F8 (paneles, sidebar)
- --bg-tertiary: #F0F0F2 (cards, inputs, modales)
- --bg-editor: #FAFAF8 (área del editor, textura de papel aplicada)
- --bg-terminal: #0a0a0c (terminales, siempre oscuro, D-058)

### Borders
- --border: #E4E4E7 (bordes unificados)

### Texto
- --text-primary: #18181B (texto principal)
- --text-secondary: #71717A (labels, metadata)
- --text-tertiary: #A1A1AA (placeholders, disabled)
- --text-editor: #18181B (texto del editor)

### Accent
- --accent: #2563EB (acento principal)
- --accent-muted: #EFF6FF (fondo de botones primarios y selección del editor)
- --hover: #F4F4F5 (color de hover general)

### Estados
- --success: #16A34A (green-600)
- --warning: #B45309 (amber-700)
- --error: #DC2626 (red-600)
- --info: #2563EB (blue-600)

### Status de capítulo
- En progreso: --text-primary
- Terminado: --success con icono check
- Modificado externamente (CLI escribió): --warning brevemente

## Tipografía

### Fuentes
- Sans (UI): Inter, system-ui, sans-serif
- Serif (editor y vista libro): Iowan Old Style, Charter, Georgia, serif
- Mono (terminal, código): JetBrains Mono, Fira Code, monospace

### Tamaños
- Editor body: 16px line-height 1.7 (lectura larga)
- Vista libro body: 18px line-height 1.8 (más aéreo)
- UI default: 14px
- UI small (labels, metadata): 12px
- Terminal: 13px
- Headings vista libro: serif, escala 1.25 (h1 32px, h2 25px, h3 20px)

## Spacing
Escala de Tailwind con preferencia por: 1, 2, 3, 4, 6, 8, 12, 16, 24. Evitar valores arbitrarios.

## Componentes base

### Botones
- Default: bg transparent, border subtle, hover bg-tertiary
- Primary: bg accent-muted, text primary, hover accent
- Ghost: solo texto, hover bg-tertiary
- Destructive: text error, hover bg con tinte rojo muy sutil
- Icon only: 32px square, padding 8px

### Inputs
- bg-tertiary, border-default, focus border-accent
- Padding 8px 12px
- Border-radius 4px

### Paneles
- bg-secondary
- Border-subtle en los lados que tocan otro panel
- Header con padding 12px 16px, border-bottom subtle

### Tabs
- Tab activo: text-primary, border-bottom accent
- Tab inactivo: text-secondary, sin border
- Hover: text-primary
- Padding 8px 16px

### Modal/Dialog
- Backdrop bg-black/60 (Tailwind utility, sin colores crudos)
- Modal bg-tertiary, border-default
- Border-radius 8px
- Padding 24px
- Max width 480px para confirmaciones, 720px para forms

### Toast
- Top-right de la ventana
- bg-tertiary, border-default
- Auto-dismiss en 4s salvo errores

## Iconografía
- Lucide React (consistente con Tailwind)
- Tamaño default 16px, 20px para acciones importantes, 14px en metadata
- Color: hereda text color del contexto

## Animaciones
- Transitions de 150ms para hovers
- Transitions de 200ms para apertura de paneles
- Sin animaciones de entrada/salida elaboradas
- Loading: spinner simple, no skeletons elaborados

## Reglas
- Cero hardcoded colors en componentes, todo via CSS vars o Tailwind tokens
- Cero shadows excepto para modales (sombra muy sutil)
- Cero gradients
- Border-radius consistente: 4px elementos pequeños, 8px paneles y modales
- Espaciado entre elementos: 8px default, 16px entre secciones, 24px entre grupos
