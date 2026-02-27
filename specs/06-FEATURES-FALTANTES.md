# Features faltantes

Documento maestro de **funcionalidades pendientes** de implementar. Agrupa: gaps de MVP, fase 2, pulidos opcionales y features especificadas pero no aún desarrolladas.

**Referencias:** recomendaciones ChatGPT (demo club 40 jugadores), `IMPLEMENTACION-REFACTOR-Y-FEATURES.md`, specs 04–07.

---

## 1. MVP – Cerrar ya

### 1.1 Activar/desactivar jugador desde la UI

| Campo | Detalle |
|--------|--------|
| **Estado** | El modelo tiene `Usuario.activo`; el login rechaza si `!usuario.activo`. No hay UI para que el staff cambie ese estado. |
| **Falta** | En listado de jugadores: columna o botón por fila (toggle/botón "Activo"/"Inactivo"). PATCH que acepte `activo`. |
| **Implementación** | En `app/(staff)/dashboard/jugadores/page.tsx` agregar control por fila. Ampliar `PATCH /api/staff/jugadores/[id]` con `activo: boolean`; usar `updateUsuario({ ...jugador, activo })`. |
| **Criterios** | Staff puede activar/desactivar jugador desde el listado; jugador inactivo no puede iniciar sesión. |

---

## 2. Fase 2 – Valor

### 2.1 Volumen total semanal / carga acumulada

| Campo | Detalle |
|--------|--------|
| **Estado** | ✅ **IMPLEMENTADO** |
| **Implementado en** | `app/api/staff/jugadores/[id]/rendimiento/route.ts` (cálculo) + `RendimientoClient.tsx` (tabla semanal con barras). |
| **Criterios** | Tabla de volumen semanal (tonelaje = Σ peso×reps) visible en vista rendimiento staff por período seleccionado. |

### 2.2 Alertas simples (staff)

| Campo | Detalle |
|--------|--------|
| **Estado** | ✅ **IMPLEMENTADO** |
| **Implementado en** | `lib/alertas.ts`, `app/api/staff/alertas/route.ts`, sección Alertas en `app/(staff)/dashboard/page.tsx`. |
| **Criterios** | Staff ve alertas de: 7 días sin entrenar y asistencia < 50% en los últimos 30 días. Sección "Alertas" en dashboard. |

---

## 3. Opcional / pulido

### 3.1 Progreso “último mes” explícito

| Campo | Detalle |
|--------|--------|
| **Estado** | Hay historial y gráficos; el “último mes” no está destacado. |
| **Falta** | Filtro o card “Último mes” en progreso (jugador) y/o rendimiento (staff). |
| **Implementación** | Selector de período o card que resuma solo último mes; en RendimientoClient asegurar que “30 días” sea claro. |
| **Criterios** | Usuario puede ver progreso/rendimiento limitado al último mes de forma clara. |

### 3.2 Perfil jugador con datos reales

| Campo | Detalle |
|--------|--------|
| **Estado** | Perfil jugador muestra placeholders; no carga usuario desde backend. |
| **Falta** | Cargar usuario con `getUsuarioById` y mostrar nombre, categoría, fecha nac., estado. |
| **Implementación** | Ver Fase 1.1 en `IMPLEMENTACION-REFACTOR-Y-FEATURES.md`. Server Component o API GET perfil. |
| **Criterios** | Perfil muestra datos reales del usuario logueado. |

---

## 4. Features especificadas, pendientes de implementación

Estas features tienen spec propia pero aún no están desarrolladas en código.

### 4.1 Gestión de lesiones (staff)

| Campo | Detalle |
|--------|--------|
| **Spec** | `04-lesiones.md` |
| **Estado** | ✅ **IMPLEMENTADO** |
| **Implementado en** | `lib/lesiones.ts`, `app/(staff)/dashboard/lesiones/`, `app/api/staff/lesiones/`. Link en `/dashboard/mas` y `/dashboard/`. |
| **Resumen** | CRUD completo, listado activos/todos con dar de alta, reporte con 3 gráficos PieChart (tipo/músculo/contexto) + tabla + impresión PDF. |

### 4.2 Home jugador (rediseño según referencia)

| Campo | Detalle |
|--------|--------|
| **Spec** | `07-home-jugador-referencia.md` |
| **Resumen** | Home con card resumen jugador, estado semanal (X/Y entrenamientos, asistencia %, próxima rutina), acciones rápidas y card “Último ejercicio” con mini gráfico. |
| **Ruta** | `app/(jugador)/home/page.tsx`. |

### 4.3 Wellness obligatorio y puntaje 0–25 (Feature A)

| Campo | Detalle |
|--------|--------|
| **Spec** | `IMPLEMENTACION-REFACTOR-Y-FEATURES.md` – Feature A |
| **Resumen** | Cuestionario wellness obligatorio antes de rutina; puntaje 0–25; reglas staff en escala 0–25. |
| **Archivos** | CuestionarioWellness, RutinaClient, page rutina, API wellness, ReglasWellnessForm. |

### 4.4 Rutinas: repeticiones por semana y circuitos (Feature B)

| Campo | Detalle |
|--------|--------|
| **Spec** | `IMPLEMENTACION-REFACTOR-Y-FEATURES.md` – Feature B |
| **Resumen** | Repeticiones en formulario por semana; circuitos con nombre; selector ejercicio en dos niveles (tipo → ejercicio). Ya parcialmente implementado; verificar criterios. |

### 4.5 Rendimiento staff y reporte PDF (Feature C)

| Campo | Detalle |
|--------|--------|
| **Spec** | `IMPLEMENTACION-REFACTOR-Y-FEATURES.md` – Feature C |
| **Resumen** | Vista rendimiento por jugador (timeline pesos, asistencia, RM relativa); reporte descargable/PDF. Puede estar ya implementado en RendimientoClient; verificar. |

---

## 5. Resumen de prioridad

| Prioridad | Ítem | Spec / referencia |
|-----------|------|-------------------|
| Alta | Activar/desactivar jugador (UI + PATCH) | § 1.1 |
| Media | Volumen/carga semanal | § 2.1 |
| Media | Alertas simples staff | § 2.2 |
| Media | Gestión de lesiones | `04-lesiones.md` |
| Media | Home jugador (rediseño) | `07-home-jugador-referencia.md` |
| Baja | Progreso último mes explícito | § 3.1 |
| Baja | Perfil con datos reales | § 3.2, IMPLEMENTACION Fase 1.1 |
| Según roadmap | Features A, B, C (wellness, rutinas, PDF) | IMPLEMENTACION-REFACTOR-Y-FEATURES.md |

---

Last updated: 2026-02-06
