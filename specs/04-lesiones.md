# Feature: Gestión de lesiones (Staff)

## Status
- [x] Specified
- [x] Implemented
- [ ] Tested
- [ ] Deployed

## Dependencies
- **Requires**: Users (jugadores), Categorías (opcional para filtros)
- **Blocks**: Ninguno

## Overview

El staff puede **gestionar lesiones** de los jugadores: registrar lesiones por jugador con **músculo**, **contexto** y **tipo**; listar lesionados activos e inactivos; editar y dar de baja lesiones; y **generar reporte de lesiones por fecha** con **gráficos de torta (pie)** por tipo (y opcionalmente por músculo/contexto).

---

## Modelo de datos

### Lesión (injury)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **id** | string | Identificador único (ej. `lesion-{timestamp}-{random}`). |
| **jugador_id** | string | ID del usuario jugador. |
| **musculo** | string | Músculo o zona afectada (ej. "Cuádriceps", "Isquiotibiales", "Hombro", "Lumbar"). Lista cerrada o texto libre según diseño. |
| **contexto** | string | Contexto en que ocurrió (ej. "Entrenamiento", "Partido", "Recuperación", "Otro"). Lista cerrada recomendada. |
| **tipo** | string | Tipo de lesión (ej. "Esguince", "Contractura", "Desgarro", "Tendinitis", "Contusión", "Otro"). Lista cerrada recomendada. |
| **fecha_inicio** | string | Fecha de inicio (YYYY-MM-DD). |
| **fecha_alta** | string \| null | Fecha de alta (cuando se considera resuelta). Null = lesión activa. |
| **notas** | string | Notas libres (opcional). |
| **activa** | boolean | Derivable: `fecha_alta == null`. Conveniente para filtros e índices. |
| **created_at** | string | ISO timestamp de creación. |
| **updated_at** | string | ISO timestamp de última actualización. |

### Persistencia (Redis)

- **Por lesión:** `lesion:{id}` → objeto Lesión.
- **Índice por jugador:** `lesiones:jugador:{jugador_id}` → list/set de IDs de lesiones (para listar lesiones de un jugador).
- **Índice activas (opcional):** `lesiones:activas` → set o list de IDs de lesiones activas (fecha_alta == null) para listado rápido de “lesionados activos”.
- **Índice por fecha (para reportes):** se pueden filtrar en aplicación por `fecha_inicio` dentro de rango; o mantener `lesiones:por_fecha:{YYYY-MM-DD}` si se necesita por día.

---

## Listas cerradas sugeridas (constantes)

- **Músculo/zona:** Cuádriceps, Isquiotibiales, Glúteos, Gemelos, Aductores, Pectorales, Hombro, Codo, Muñeca, Lumbar, Cervical, Core, Otro.
- **Contexto:** Entrenamiento, Partido, Recuperación, Otro.
- **Tipo:** Esguince, Contractura, Desgarro, Tendinitis, Contusión, Sobrecarga, Otro.

*(Definir en `lib/constants.ts` o en config; el staff solo elige de lista.)*

---

## Funcionalidades

### 1. Alta de lesión

- El staff selecciona un **jugador** (desde listado de jugadores o desde la sección Lesiones).
- Completa: **músculo**, **contexto**, **tipo**, **fecha_inicio**, **notas** (opcional).
- Al guardar se crea el registro con `fecha_alta = null`, `activa = true`.

### 2. Listado de lesionados

- **Vista “Lesionados activos”:** jugadores con al menos una lesión con `fecha_alta == null`. Columnas sugeridas: jugador (nombre, categoría), músculo, tipo, contexto, fecha inicio, acciones (editar / dar alta).
- **Vista “Histórico (activos + inactivos)”:** mismo listado pero incluyendo lesiones ya dadas de alta (fecha_alta no null). Toggle o pestaña “Solo activos” / “Todos”.
- Orden: por fecha_inicio descendente o por jugador.

### 3. Edición y gestión completa

- **Editar lesión:** modificar músculo, contexto, tipo, fecha_inicio, notas. Opcional: fecha_alta (dar alta desde el mismo formulario).
- **Dar de alta:** botón “Dar alta” que setea `fecha_alta = hoy` y actualiza `updated_at`. La lesión pasa a “inactiva”.
- **Eliminar (opcional):** si se requiere borrado lógico/físico, especificarlo; por defecto con “dar de alta” basta para sacarla de activas.

### 4. Reporte de lesiones por fecha

- **Filtro:** rango de fechas (desde – hasta). Se consideran lesiones cuya **fecha_inicio** cae dentro del rango (o variante: lesiones “activas en ese rango” si se prefiere).
- **Contenido del reporte:**
  - Resumen: total de lesiones en el período, cantidad por tipo, por músculo, por contexto.
  - **Gráficos de torta (pie):**
    - Una torta por **tipo** de lesión (Esguince, Contractura, Desgarro, etc.).
    - Opcional: tortas adicionales por **músculo** y por **contexto**.
  - Tabla o lista de lesiones del período (jugador, músculo, tipo, contexto, fecha_inicio, fecha_alta si existe).
- **Exportación:** descargar como PDF o imprimir. Misma estética que otros reportes (cards, títulos, Recharts).

### 5. Integración en la app

- **Ruta:** `app/(staff)/dashboard/lesiones/` con:
  - `page.tsx`: listado (activos / todos) + botón “Nueva lesión” + enlace a reporte.
  - `nueva/page.tsx` o modal: formulario alta lesión (jugador, músculo, contexto, tipo, fecha_inicio, notas).
  - `[id]/editar/page.tsx` o modal: formulario edición + botón “Dar alta”.
  - `reporte/page.tsx`: filtro por fechas, gráficos de torta por tipo (y opcional músculo/contexto), tabla resumen, botón descargar PDF.
- **Navegación:** agregar ítem “Lesiones” en el menú staff (por ejemplo bajo “Más” en `StaffNav` o en la página “Más” como link a `/dashboard/lesiones`). Opcional: desde la ficha del jugador (ej. en rendimiento o listado) un link “Ver/agregar lesiones”.

---

## API (Next.js API Routes)

- **POST** `/api/staff/lesiones` — Crear lesión (body: jugador_id, musculo, contexto, tipo, fecha_inicio, notas?). Solo staff.
- **GET** `/api/staff/lesiones` — Listar lesiones. Query: `?activas=true|false`, `?jugador_id=`, `?desde=`, `?hasta=` (para reporte).
- **GET** `/api/staff/lesiones/[id]` — Obtener una lesión por ID. Solo staff.
- **PATCH** `/api/staff/lesiones/[id]` — Actualizar lesión (musculo, contexto, tipo, fecha_inicio, notas, fecha_alta?). Solo staff.
- **POST** `/api/staff/lesiones/[id]/alta` — Dar de alta (setear fecha_alta = hoy). Opcional si PATCH ya lo permite.

Validación con Zod; respuestas consistentes `{ error }` o `{ ok, lesion }` / `{ lesiones }`.

---

## UI (resumen)

- **Listado:** tabla o cards con jugador, músculo, tipo, contexto, fechas; filtro activos/todos; botones editar y dar alta.
- **Formularios:** selects para músculo, contexto, tipo; date para fecha_inicio; textarea para notas; select o búsqueda de jugador.
- **Reporte:** selector de rango de fechas; al menos un **PieChart (Recharts)** por tipo de lesión; opcional más tortas por músculo y contexto; tabla de detalle; botón “Descargar PDF” o “Imprimir”.

---

## Criterios de aceptación

- [ ] Staff puede crear lesión asignada a un jugador con músculo, contexto, tipo, fecha_inicio y notas.
- [ ] Staff ve listado de lesionados activos y puede cambiar a listado de todos (activos + inactivos).
- [ ] Staff puede editar una lesión y dar de alta (fecha_alta).
- [ ] Staff puede generar reporte por rango de fechas con gráficos de torta por tipo (y opcional por músculo/contexto) y tabla/listado de lesiones.
- [ ] El reporte se puede descargar o imprimir (PDF).
- [ ] Persistencia en Redis según modelo anterior; rutas bajo `/dashboard/lesiones` y APIs bajo `/api/staff/lesiones`.

---

Last updated: 2026-02-06
