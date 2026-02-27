# Spec: Home del jugador (diseño de referencia)

## Status
- [x] Specified
- [ ] Implemented
- [ ] Tested

## Uso

Referencia de diseño para rediseñar la pantalla de inicio del jugador (`app/(jugador)/home/page.tsx`). Puede usarse como prompt para ChatGPT o como spec para desarrollo.

---

## Objetivo

Rediseñar el home del jugador para que sea más informativo: resumen semanal, estado de entrenamientos y último ejercicio destacado.

---

## Diseño deseado

### 1. Barra superior (header)

- Opcional: hora actual; centro: "San Martín" + logo; derecha: iconos de estado e icono de notificaciones (campana) con punto rojo si hay notificaciones.
- Si el layout ya tiene header con logo y usuario, integrar o omitir según convenga.

### 2. Card "Resumen del jugador"

- Nombre del jugador y categoría (ej. "M19").
- Icono llama + "Esta semana: X sesiones completadas" (según registros/RPE de la semana).
- Flecha a la derecha → detalle o historial (ej. `/progreso`).

### 3. Card "Estado semanal"

- Título: "Estado semanal".
- "X/Y entrenamientos" con barra de progreso horizontal roja.
- "Asistencia XX%" y "Próxima rutina: [NOMBRE]".
- Mensaje motivacional: "¡Seguimos mejorando!".

### 4. Acciones rápidas

- Marcar Asistencia (verde) → `/asistencia`.
- Ver Rutina (rojo) → `/rutina`, subtítulo con nombre de rutina activa.
- Progreso (azul) → `/progreso`, subtítulo "Explorar".

### 5. Card "Último ejercicio"

- Nombre del ejercicio, peso alcanzado, "+X kg la semana pasada" (comparación con semana anterior).
- Mini gráfico de evolución (línea) del ejercicio.
- Flecha → `/progreso/[id]`.
- Si no hay registros: mensaje "Aún no tenés registros. Comenzá tu rutina para ver tu evolución."

### 6. Navegación inferior

- Inicio activo en `/home` (resaltado). Resto: Rutina, Asistencia, Progreso, Perfil.

---

## Datos necesarios

1. Usuario: nombre, categoría (nombre para mostrar).
2. Rutina activa: para "Próxima rutina".
3. Sesiones esta semana: contar días con registros o RPE en la semana actual.
4. Entrenamientos de la semana: días de ejercicio en la rutina vs. completados.
5. Asistencia %: período reciente (ej. mes).
6. Último ejercicio: registro más reciente, peso semana pasada, lista para mini gráfico.

---

## Stack y archivos

- **Página:** `app/(jugador)/home/page.tsx`.
- **Layout:** `app/(jugador)/layout.tsx` (header y bottom nav existentes).
- **Datos:** `getUsuarioById`, `getRutinaActivaByCategoria`, `getRegistrosByJugador`, funciones de asistencia y RPE en `lib/`.

---

## Criterios de aceptación

- [ ] Card resumen jugador con nombre, categoría y "X sesiones completadas esta semana".
- [ ] Card "Estado semanal" con X/Y entrenamientos, barra roja, asistencia % y próxima rutina.
- [ ] Tres acciones: Marcar Asistencia, Ver Rutina, Progreso (links y subtítulos correctos).
- [ ] Card "Último ejercicio" con nombre, peso, comparación y mini gráfico; o mensaje sin registros.
- [ ] Estilo consistente (San Martín red, cards blancas, bordes redondeados).
- [ ] Bottom nav con "Inicio" activo en `/home`.

---

Last updated: 2026-02-06
