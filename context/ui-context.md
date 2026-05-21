# Writing IDE - UI Context

## Filosofía visual
Editor técnico que respira como un libro. Dark mode por default (estamos escribiendo de noche o con luz baja). Tipografía serif en el área de texto, monospace en terminales, sans-serif en UI chrome. Sin gradientes, sin animaciones excesivas, sin sombras dramáticas. Quieto, enfocado, hermoso.

## Tema (dark mode por default)

### Colores base
- --bg-primary: #0d0d0f (fondo principal de la app)
- --bg-secondary: #161618 (paneles, sidebar)
- --bg-tertiary: #1d1d20 (cards, modales)
- --bg-editor: #131316 (área del editor, ligeramente diferente para foco)
- --bg-terminal: #0a0a0c (terminales más oscuros)

### Borders
- --border-subtle: #26262a (separadores sutiles)
- --border-default: #34343a (bordes visibles)
- --border-strong: #45454d (focus states)

### Texto
- --text-primary: #e8e8ec (texto principal)
- --text-secondary: #a8a8b0 (labels, metadata)
- --text-tertiary: #6c6c75 (placeholders, disabled)
- --text-editor: #d4d4dc (texto del editor, ligeramente más suave)

### Accent
- --accent: #7c8aa8 (acento principal, azul-gris apagado)
- --accent-hover: #93a1c0
- --accent-muted: #4a5468

### Estados
- --success: #6b9a7e
- --warning: #c4a572
- --error: #b07070
- --info: #7a93b8

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
- Backdrop bg #000 con opacity 0.6
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
