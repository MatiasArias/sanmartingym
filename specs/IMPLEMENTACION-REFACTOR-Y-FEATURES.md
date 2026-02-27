# Spec de implementación – San Martín Gym
## Refactor, mejoras y funcionalidades pendientes

**Versión:** 1.0  
**Alcance:** Ejecución completa (hay tiempo para todas las funcionalidades).  
**Orden sugerido:** Fase 0 (fundamentos) → Fases 1–5 (refactor) → Features A–C (nuevas funcionalidades).

---

# Fase 0 – Fundamentos y seguridad

## 0.1 Configuración centralizada y seguridad JWT

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 0.1.1 | Crear `lib/config.ts` | Exportar objeto tipado con: `redisUrl`, `jwtSecret`, `appName` (opcional), `nodeEnv`. Validar con Zod; si `JWT_SECRET` falta o está vacío, lanzar error al importar (no fallback). Documentar en README. |
| 0.1.2 | Eliminar fallback en `lib/auth.ts` | Usar `config.jwtSecret` desde `lib/config.ts`. No usar nunca un secret por defecto hardcodeado. |
| 0.1.3 | Actualizar consumidores de env | Redis: usar `config.redisUrl`. Login/API que lean env: usar config donde aplique. Mantener `.env.example` con `JWT_SECRET` y `REDIS_URL`/`SANMARTIN_REDIS_URL`. |

## 0.2 Constantes de negocio

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 0.2.1 | Crear `lib/constants.ts` | Definir: `DNI_MIN_LENGTH`, `DNI_MAX_LENGTH`, `RUTINA_SEMANAS_MIN`, `RUTINA_SEMANAS_MAX`, `WELLNESS_SCORE_MIN`, `WELLNESS_SCORE_MAX` (0 y 25), lista `MUSCULOS_DEFAULT` (Cuádriceps, Isquiotibiales, …). Usar en validaciones Zod y en formularios donde corresponda. |
| 0.2.2 | Feature flags (opcional) | En config: `WELLNESS_OBLIGATORIO` (boolean), `REPORTE_PDF_HABILITADO` (boolean). Leer desde env. Usar en rutina (bloquear o no hasta wellness) y en vista rendimiento (mostrar/ocultar botón PDF). |

---

# Fase 1 – Estabilización y datos correctos

## 1.1 Perfil jugador con datos reales

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 1.1.1 | Cargar usuario en perfil jugador | En `app/(jugador)/perfil/page.tsx`: convertir a Server Component o cargar usuario vía `getUsuarioById` (layout ya tiene payload). Mostrar: nombre, DNI (enmascarado si se desea), categoría (nombre), fecha nac., estado activo. Eliminar placeholder "Jugador" / "Activo" hardcodeado. |
| 1.1.2 | Opcional: API GET perfil | Si se prefiere cliente: `GET /api/jugador/perfil` que devuelva usuario (sin datos sensibles extra). Usar en perfil para rellenar estado. |

## 1.2 Navegación staff completa

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 1.2.1 | Enlaces a Categorías y Wellness en nav staff | Incluir en el bottom nav del staff acceso a Categorías y a Wellness (o un ítem "Más" que lleve a una subvista con ambos). Objetivo: no depender solo del dashboard para llegar a esas pantallas. |

## 1.3 Feedback y errores unificados

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 1.3.1 | Patrón de error en formularios | Definir componente o bloque estándar: mensaje de error arriba del form (banner rojo con texto). Usarlo en RutinaForm, JugadorForm, EjercicioForm, CategoriaForm, Login, ReglasWellness. |
| 1.3.2 | Mensajes de éxito | Tras guardar rutina, jugador, ejercicio, categoría, wellness, asistencia: mostrar mensaje de éxito (estado local o toast mínimo) y, si aplica, redirigir o cerrar modal. |
| 1.3.3 | Respuestas de API | API routes devuelven `{ error: string }` o `{ ok: true, ... }` de forma consistente. Cliente muestra el mensaje cuando hay `error`. |

---

# Fase 2 – Modularización del código

## 2.1 Dividir `lib/redis.ts`

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 2.1.1 | Cliente Redis único | Crear `lib/redis-client.ts`: exportar `redis` (wrapper get/set/lpush/lrange/keys/del/zadd/zcount/zrem) y función de parse. Sin tipos de dominio. |
| 2.1.2 | Módulos por dominio | Crear bajo `lib/`: `usuarios.ts`, `categorias.ts`, `rutinas.ts`, `ejercicios.ts`, `registros.ts`, `wellness.ts`, `comentarios.ts`, `asistencia.ts`. Cada uno: tipos del dominio + funciones que usan `redis` desde `redis-client`. Migrar funciones y tipos desde `redis.ts` sin cambiar comportamiento. |
| 2.1.3 | Barrel y limpieza | Mantener `lib/redis.ts` como re-export de tipos y funciones necesarias para no romper imports, o actualizar todos los imports a los nuevos módulos y luego eliminar el archivo monolítico. |

## 2.2 Componentes UI base

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 2.2.1 | Crear `components/ui/` | Implementar: `Button` (variantes primary/secondary/ghost, disabled), `Card` (título opcional, children), `Input` (label, error opcional), `Select` (label, options), `ErrorMessage` (texto en rojo/bloque). Usar Tailwind y variables existentes (sanmartin-red, etc.). |
| 2.2.2 | Uso progresivo | Sustituir en: Login, Home jugador, Home staff, formularios de jugador/ejercicio/categoría/rutina (donde sea directo) los bloques repetidos por estos componentes. No obligatorio migrar todo en un solo PR; puede ser por fases. |

## 2.3 Simplificar RutinaForm

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 2.3.1 | Subcomponentes | Extraer: `RutinaDatosBasicos` (categoría, nombre, fecha inicio, semanas), `RutinaDiaBloque` (un día con tipo partido/descanso/ejercicio y contenido), `CircuitoBloque` (nombre circuito + lista de ejercicios + agregar ejercicio), `ConfigSemanaInputs` (por semana: series, repeticiones, RIR, nota). El estado sigue en RutinaForm; solo se divide la presentación. |
| 2.3.2 | Legibilidad | Reducir anidación y longitud del JSX en RutinaForm. Mantener misma lógica de submit y payload a la API. |

---

# Fase 3 – UX y consistencia

## 3.1 Navegación activa

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 3.1.1 | Resaltar ítem activo en nav | En layouts jugador y staff: en `NavLink`, comparar `pathname` (usePathname) con `href` (o segmento). Si coincide, aplicar clase activa (ej. bg-sanmartin-red text-white en jugador, bg-gray-700 text-white en staff). |

## 3.2 Estados vacíos y carga

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 3.2.1 | Revisar listas y vistas | En: rutinas por categoría, jugadores, ejercicios, asistencias, comentarios, progreso jugador, rendimiento staff: si no hay datos, mostrar mensaje claro + acción si aplica (ej. "Crear primera rutina"). |
| 3.2.2 | Carga | Donde se haga fetch cliente (asistencias, rendimiento, etc.): mostrar estado de carga (spinner o skeleton) hasta tener datos o error. |

## 3.3 Flujo de rutina (jugador)

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 3.3.1 | Claridad del flujo | Asegurar orden visible: Wellness (si aplica) → selector de día → ejercicios → RPE. Si wellness es omitible, un solo CTA "Omitir y ver rutina" y el resto del flujo con el mismo orden siempre. |

---

# Fase 4 – Configurabilidad y calidad

## 4.1 Uso de constantes

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 4.1.1 | Formularios y validaciones | Reemplazar números y listas hardcodeados por imports desde `lib/constants.ts` (y `lib/config.ts` si hay flags) en: login (DNI), RutinaForm (semanas), EjercicioForm (músculos), wellness (escala 0–25). |

## 4.2 Tests

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 4.2.1 | Configurar Vitest | Añadir Vitest (y jsdom si hace falta) en devDependencies. Script `test` en package.json. Configurar para TypeScript y `app/`/`lib/`. |
| 4.2.2 | Tests unitarios | Al menos: `lib/calculadora-peso.ts` (casos conocidos); schemas Zod de login, rutinas, wellness (valid/invalid). |
| 4.2.3 | Tests de API | Al menos 1–2 integración: POST login (éxito/rechazo), GET rutina activa o GET rendimiento (con mock de Redis o datos de test). |

---

# Fase 5 – UI y diseño (opcional)

## 5.1 Tokens y escala

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 5.1.1 | Documentar tokens | En tailwind.config o globals: escala de espaciado y tamaños de texto (h1–h4, body, caption). Documentar en specs o en Storybook si se añade. |
| 5.1.2 | Aplicar donde se toque | En nuevas pantallas o refactors, usar esas clases en lugar de valores sueltos. |

## 5.2 Reportes y referencia visual

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| 5.2.1 | Alinear con referencia | Revisar vista de rendimiento y PDF con el video de referencia acordado; ajustar layout, cards y gráficos si hace falta para acercarse al diseño deseado. |

---

# Feature A – Wellness obligatorio y puntaje 0–25

## A.1 Cuestionario obligatorio

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| A.1.1 | Bloquear rutina sin wellness | Si el jugador no tiene wellness del día: en la página de rutina no mostrar ejercicios ni PesoForm; mostrar solo el bloque del cuestionario wellness (sin opción "Omitir" cuando `WELLNESS_OBLIGATORIO` es true, o mantener omitir si es false). |
| A.1.2 | Puntaje 0–25 | Cuestionario: 5 preguntas 1–5, suma = 5–25 (o 4 preguntas y escala a 0–25). Guardar y mostrar "Wellness hoy: X/25". API y Redis: guardar score en escala 0–25. |
| A.1.3 | Reglas staff en 0–25 | En dashboard wellness, reglas que usen umbrales en escala 0–25 (o equivalente). Aplicar adaptación de series/repeticiones según ese score en `getEjerciciosByRutinaYDiaConAyuda` o donde se apliquen las reglas. |

**Archivos:** `CuestionarioWellness.tsx`, `RutinaClient.tsx`, `app/(jugador)/rutina/page.tsx`, `app/api/wellness/route.ts`, `lib/wellness.ts` (o redis), `ReglasWellnessForm.tsx`, `app/api/staff/wellness-rules/route.ts`.

---

# Feature B – Rutinas: repeticiones por semana y circuitos

## B.1 Repeticiones en formulario

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| B.1.1 | Config por semana con repeticiones | `ConfigSemana` incluye `repeticiones`. En RutinaForm (o ConfigSemanaInputs): input "Repeticiones" por semana junto a Series y RIR. Persistir en API y en Redis; resolver repeticiones por semana en `getEjerciciosByRutinaYDiaConAyuda`. |
| B.1.2 | Jugador ve reps por semana | En la vista de rutina del jugador, mostrar las repeticiones correspondientes a la semana actual (desde config_por_semana). |

## B.2 Circuitos

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| B.2.1 | Modelo | Ejercicios en rutina tienen `circuito_nombre` (opcional). Por día: lista de circuitos con nombre y ejercicios (ya implementado en RutinaForm con `circuitos`). Guardar/cargar en API y Redis. |
| B.2.2 | Vista jugador | Agrupar ejercicios por `circuito_nombre` y mostrar títulos (ej. "Fuerza 1", "Fuerza 2") en RutinaClient. |
| B.2.3 | Selector en dos niveles | En RutinaForm, al agregar ejercicio a un circuito: primer select = tipo/grupo muscular (`musculo_principal`); segundo select = ejercicios de ese grupo. Botón "+" añade la plantilla seleccionada. Placeholders: "Tipo / grupo muscular", "Ejercicio". |

**Archivos:** `lib/ejercicios.ts` / `lib/rutinas.ts`, `RutinaForm.tsx`, `app/api/staff/rutinas/route.ts`, `app/api/staff/rutinas/[id]/route.ts`, `RutinaClient.tsx`.

---

# Feature C – Staff: rendimiento, asistencia y reporte PDF

## C.1 Vista rendimiento por jugador

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| C.1.1 | Línea de tiempo de pesos | En `/dashboard/jugadores/[id]/rendimiento`: gráfico o lista temporal de pesos por ejercicio a lo largo del tiempo (usar registros del jugador). |
| C.1.2 | Barra de asistencia | Resumen de asistencia del jugador en el período (días presentes / total, porcentaje). Visible arriba o en sección destacada. |
| C.1.3 | Métricas | Incluir: RM relativa donde aplique (peso corporal en usuario si existe), mejor serie por ejercicio, evolución. Diseño tipo cards/dashboard según referencia. |

## C.2 Reporte descargable y PDF

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| C.2.1 | Generar reporte | Botón "Generar reporte" / "Descargar PDF": contenido con resumen asistencia, métricas (RM relativa, etc.) y evolución. Misma estética que la vista en pantalla. |
| C.2.2 | PDF | Opción de descarga como PDF (jsPDF, react-pdf o endpoint que devuelva PDF). Respeta feature flag si existe. |

**Archivos:** `app/(staff)/dashboard/jugadores/[id]/rendimiento/page.tsx`, `RendimientoClient.tsx`, `app/api/staff/jugadores/[id]/rendimiento/route.ts`, y módulos de registros/asistencia en lib.

---

# Feature D – Gestión de lesiones (Staff)

## D.1 Modelo y API

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| D.1.1 | Modelo Lesión | Entidad con: jugador_id, musculo, contexto, tipo, fecha_inicio, fecha_alta (null = activa), notas. Persistencia en Redis: `lesion:{id}`, índices por jugador y activas. Ver `specs/04-lesiones.md`. |
| D.1.2 | API CRUD | POST/GET/PATCH `/api/staff/lesiones` y GET/PATCH `/api/staff/lesiones/[id]`. Endpoint opcional POST `[id]/alta` para dar de alta. Validación Zod; solo staff. |

## D.2 Listas cerradas y formularios

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| D.2.1 | Constantes | Músculo (Cuádriceps, Isquiotibiales, Hombro, Lumbar, …), Contexto (Entrenamiento, Partido, Recuperación, Otro), Tipo (Esguince, Contractura, Desgarro, Tendinitis, …). En `lib/constants.ts` o módulo lesiones. |
| D.2.2 | Alta y edición | Formulario: selección jugador, músculo, contexto, tipo, fecha_inicio, notas. Edición: mismos campos + botón "Dar alta" (fecha_alta = hoy). |

## D.3 Listado y reporte

| ID | Tarea | Criterios de aceptación |
|----|--------|-------------------------|
| D.3.1 | Listado lesionados | Vista con filtro "Solo activos" / "Todos". Columnas: jugador, músculo, tipo, contexto, fecha_inicio, acciones (editar, dar alta). Ruta `/dashboard/lesiones`. |
| D.3.2 | Reporte por fecha | Filtro rango de fechas (desde–hasta). Gráficos de **torta (PieChart, Recharts)** por **tipo** de lesión; opcional por músculo y contexto. Tabla/listado de lesiones del período. |
| D.3.3 | Descarga PDF | Botón para generar e imprimir/descargar reporte de lesiones (resumen + tortas + tabla). Misma estética que otros reportes. |

**Archivos:** `specs/04-lesiones.md` (spec completa), `lib/lesiones.ts` (o módulo en lib), `app/(staff)/dashboard/lesiones/**`, `app/api/staff/lesiones/**`. Navegación: enlace en "Más" o en StaffNav a `/dashboard/lesiones`.

---

# Criterios de cierre generales

- Todas las tareas de Fase 0 y 1 completadas (seguridad y datos correctos).
- Al menos Fase 2.1 (modularización Redis) y 2.2 (componentes UI base) completadas.
- Features A, B, C y D implementadas según sus criterios de aceptación.
- Sin fallback de JWT secret; config validada al arranque.
- README y `.env.example` actualizados con variables y pasos para correr tests.
- Opcional: checklist en PR o en documento de estado (specs) para marcar ítems completados.
