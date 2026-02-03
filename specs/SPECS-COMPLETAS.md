# San Martín Gym – Especificaciones Completas

> Documento maestro de especificaciones funcionales, no funcionales y user stories.  
> Última actualización: 2026-02-03

---

# Parte 1. Especificaciones Funcionales

## 1.1 Autenticación y Usuarios

| ID | Requisito | Descripción | Prioridad |
|----|-----------|-------------|-----------|
| F-AUTH-01 | Login por DNI | El sistema permite autenticación ingresando únicamente el DNI (7-8 dígitos). No se requiere contraseña. | Alta |
| F-AUTH-02 | Roles | Dos roles: **jugador** y **staff**. El rol determina las funcionalidades disponibles. | Alta |
| F-AUTH-03 | Redirect según rol | Tras login exitoso: staff → `/dashboard`, jugador → `/home`. | Alta |
| F-AUTH-04 | Sesión JWT | La sesión se mantiene mediante JWT en cookie (`auth_token`). | Alta |
| F-AUTH-05 | Logout | El usuario puede cerrar sesión desde su perfil o menú. | Media |
| F-AUTH-06 | Usuario inexistente | Si el DNI no está registrado, se muestra mensaje de error. | Alta |

### Modelo de Usuario
- `id`, `dni`, `nombre`, `rol`, `categoria_id` (opcional), `fecha_nacimiento` (opcional), `activo`

---

## 1.2 Gestión de Jugadores (Staff)

| ID | Requisito | Descripción | Prioridad |
|----|-----------|-------------|-----------|
| F-JUG-01 | Listar jugadores | El staff puede ver el listado de jugadores con DNI, nombre, fecha de nacimiento y categoría. | Alta |
| F-JUG-02 | Crear jugador | El staff puede dar de alta jugadores con: DNI (7-8 dígitos), nombre, fecha de nacimiento (YYYY-MM-DD), categoría. | Alta |
| F-JUG-03 | Categoría obligatoria | Cada jugador debe tener una categoría asignada para acceder a su rutina. | Alta |
| F-JUG-04 | Validación DNI único | No se permiten DNI duplicados. | Alta |

### Categorías predefinidas
M15, M17, Primera, Femenino

---

## 1.3 Catálogo de Ejercicios (Staff)

| ID | Requisito | Descripción | Prioridad |
|----|-----------|-------------|-----------|
| F-EJ-01 | Listar ejercicios | El staff puede ver el catálogo de ejercicios (plantillas). | Alta |
| F-EJ-02 | Crear ejercicio | Crear plantilla con: nombre, series_default, rir_default, repeticiones_default, tipo (empuje/tracción), musculo_principal, modo_serie, ayuda_alumno. | Alta |
| F-EJ-03 | Editar ejercicio | Modificar cualquier campo de una plantilla existente. | Alta |
| F-EJ-04 | Eliminar ejercicio | Eliminar una plantilla del catálogo. | Media |
| F-EJ-05 | Modos de serie | Soporta: serie_x_repeticion, serie_x_minutos, serie_x_brazo. | Media |
| F-EJ-06 | Músculos predefinidos | Cuádriceps, Isquiotibiales, Glúteos, Pectorales, Dorsales, Hombros, Bíceps, Tríceps, Core, Gemelos, Otro. | Baja |

---

## 1.4 Rutinas (Staff)

| ID | Requisito | Descripción | Prioridad |
|----|-----------|-------------|-----------|
| F-RUT-01 | Crear rutina | Rutina por categoría con: nombre, fecha_inicio, semanas, dias_config (lunes a sábado). | Alta |
| F-RUT-02 | Editar rutina | Modificar datos básicos y configuración de días de una rutina existente. | Alta |
| F-RUT-03 | Tipo de día | Por día: **Partido**, **Descanso** o **Ejercicio**. | Alta |
| F-RUT-04 | Agregar ejercicios | En días de ejercicio, agregar ejercicios desde el catálogo. | Alta |
| F-RUT-05 | Config por semana | Cada ejercicio tiene series y RIR configurables por semana (1, 2, 3...) para progresión. | Alta |
| F-RUT-06 | Notas por semana | Opcional: nota específica por semana para un ejercicio. | Media |
| F-RUT-07 | Rutina activa | Solo una rutina activa por categoría (fecha actual dentro de fecha_inicio y fecha_fin). | Alta |
| F-RUT-08 | Comentarios en ejercicios | Staff puede agregar comentarios/feedback a ejercicios de rutina (anónimo o con nombre). | Media |
| F-RUT-09 | Notificación comentarios nuevos | El dashboard del staff muestra contador de comentarios no leídos. | Media |

---

## 1.5 Visualización de Rutina (Jugador)

| ID | Requisito | Descripción | Prioridad |
|----|-----------|-------------|-----------|
| F-VR-01 | Rutina activa por categoría | El jugador ve la rutina activa de su categoría. | Alta |
| F-VR-02 | Selección de día | El jugador puede elegir día (lunes a sábado) para ver ejercicios del día. | Alta |
| F-VR-03 | Semana actual | Se muestra "Semana X" calculada desde fecha_inicio. | Alta |
| F-VR-04 | Ejercicios del día | Listado con: nombre, series, repeticiones, RIR, ayuda al alumno, nota de semana. | Alta |
| F-VR-05 | Peso sugerido | Si hay historial de registros, se muestra peso sugerido (fórmula Epley) por ejercicio. | Media |
| F-VR-06 | Cuestionario Wellness | Opcional antes de entrenar: sueño, energía, dolor muscular, estrés (1-10 cada uno). | Media |
| F-VR-07 | Adaptación por Wellness | Si score wellness < 6: se reduce una serie y una rep por ejercicio para recuperación. | Media |

---

## 1.6 Registro de Carga y RPE (Jugador)

| ID | Requisito | Descripción | Prioridad |
|----|-----------|-------------|-----------|
| F-REG-01 | Registrar peso y reps | Por cada serie del ejercicio, el jugador puede marcar peso (kg) y reps realizadas. | Alta |
| F-REG-02 | Marcar serie completada | Checkbox para indicar serie realizada. | Alta |
| F-REG-03 | Persistencia local | Los datos de series se guardan en localStorage hasta finalizar jornada. | Media |
| F-REG-04 | Escala RPE | Al finalizar, el jugador indica esfuerzo percibido (1-10). | Alta |
| F-REG-05 | Finalizar jornada | Al enviar RPE: se guardan registros de carga, RPE y asistencia en servidor. | Alta |
| F-REG-06 | Una asistencia por día | No se puede marcar asistencia dos veces el mismo día. | Alta |

---

## 1.7 Asistencia

| ID | Requisito | Descripción | Prioridad |
|----|-----------|-------------|-----------|
| F-ASIS-01 | Marcar asistencia | La asistencia se marca automáticamente al "Finalizar jornada" (RPE) en la rutina. | Alta |
| F-ASIS-02 | Calendario personal | El jugador ve calendario mensual con sus asistencias marcadas y días de partido. | Media |
| F-ASIS-03 | Días de partido | Se distinguen días de partido (rutina) vs días normales. Partido sin asistir se marca en rojo. | Media |
| F-ASIS-04 | Staff: vista por día | Staff puede ver quiénes asistieron/ausentes en una fecha concreta, con RPE si existe. | Alta |
| F-ASIS-05 | Staff: vista por mes | Staff puede ver resumen mensual por jugador: días presentes/total y porcentaje. | Alta |
| F-ASIS-06 | Filtro por categoría | En asistencias del staff, filtrar por categoría. | Media |

---

## 1.8 Progreso (Jugador)

| ID | Requisito | Descripción | Prioridad |
|----|-----------|-------------|-----------|
| F-PROG-01 | Lista de ejercicios con historial | El jugador ve ejercicios en los que tiene registros de carga. | Alta |
| F-PROG-02 | Último registro | Se muestra último peso × reps y fecha por ejercicio. | Alta |
| F-PROG-03 | Detalle por ejercicio | Al entrar, historial completo: peso máx, reps máx, total series, registros por fecha. | Alta |
| F-PROG-04 | Calculadora 1RM | Herramienta para estimar 1RM a partir de peso × reps (fórmula Epley). | Media |
| F-PROG-05 | Peso para reps objetivo | Dado 1RM, calcular peso sugerido para N repeticiones. | Media |

---

## 1.9 Perfil y Comentarios

| ID | Requisito | Descripción | Prioridad |
|----|-----------|-------------|-----------|
| F-PERF-01 | Perfil jugador | Ver rol y estado (básico). Opción de cerrar sesión. | Media |
| F-COM-01 | Comentarios en ejercicios | Staff agrega comentarios/feedback sobre ejercicios (desde vista rutina). | Media |
| F-COM-02 | Sección Comentarios (jugador) | Página "Comentarios" preparada para chat con entrenador (próximamente). | Baja |

---

# Parte 2. Especificaciones No Funcionales

## 2.1 Rendimiento

| ID | Requisito | Descripción |
|----|-----------|-------------|
| NF-PERF-01 | Tiempo de carga inicial | La aplicación debe cargar la página principal en < 3 segundos en conexión 4G. |
| NF-PERF-02 | Operaciones API | Las operaciones CRUD deben responder en < 1 segundo en condiciones normales. |
| NF-PERF-03 | Caché | Uso de Redis para persistencia y consultas rápidas. |

---

## 2.2 Usabilidad (UX)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| NF-UX-01 | Mobile-first | La interfaz está diseñada principalmente para uso en móvil. |
| NF-UX-02 | Navegación clara | Menú y acciones principales accesibles con pocos toques. |
| NF-UX-03 | Feedback visual | Estados de carga, éxito y error visibles al usuario. |
| NF-UX-04 | Accesibilidad básica | Uso de labels, aria-labels y contraste adecuado. |

---

## 2.3 Seguridad

| ID | Requisito | Descripción |
|----|-----------|-------------|
| NF-SEG-01 | JWT en cookie | Token de sesión en cookie HttpOnly (según configuración). |
| NF-SEG-02 | Validación por rol | Las APIs validan rol antes de ejecutar operaciones sensibles. |
| NF-SEG-03 | Variables de entorno | Credenciales (REDIS_URL, JWT_SECRET) solo en variables de entorno, nunca en código. |
| NF-SEG-04 | Validación de entrada | Uso de Zod para validar payloads en API routes. |

---

## 2.4 Disponibilidad y Escalabilidad

| ID | Requisito | Descripción |
|----|-----------|-------------|
| NF-DIS-01 | Despliegue Vercel | La aplicación se despliega en Vercel (serverless). |
| NF-DIS-02 | Redis externo | Redis (Labs, self-hosted, etc.) como base de datos. |
| NF-DIS-03 | Tolerancia a fallos | Mensajes de error amigables ante fallos de Redis o red. |

---

## 2.5 Mantenibilidad

| ID | Requisito | Descripción |
|----|-----------|-------------|
| NF-MAN-01 | TypeScript | Código tipado para reducir errores y facilitar refactors. |
| NF-MAN-02 | Especificaciones SDD | Las specs en `specs/` son fuente de verdad. Código sigue especificaciones. |
| NF-MAN-03 | Estructura modular | Separación por features: auth, ejercicios, rutinas, asistencias. |

---

## 2.6 Tecnología

| ID | Requisito | Descripción |
|----|-----------|-------------|
| NF-TEC-01 | Next.js 15 | App Router, React Server Components. |
| NF-TEC-02 | Tailwind CSS | Estilos utilitarios. |
| NF-TEC-03 | ioredis | Cliente Redis para Node.js. |
| NF-TEC-04 | jose | JWT para autenticación. |
| NF-TEC-05 | Zod | Validación de esquemas. |

---

# Parte 3. User Stories

## 3.1 Autenticación

| ID | Historia | Criterios de Aceptación |
|----|----------|-------------------------|
| US-AUTH-01 | Como **jugador**, quiero **iniciar sesión con mi DNI** para acceder a mi rutina y progreso. | DNI válido (7-8 dígitos) → login exitoso, redirect a /home. DNI inexistente → mensaje de error. |
| US-AUTH-02 | Como **staff**, quiero **iniciar sesión con mi DNI** para gestionar rutinas y jugadores. | DNI válido de staff → login exitoso, redirect a /dashboard. |
| US-AUTH-03 | Como **usuario autenticado**, quiero **cerrar sesión** para proteger mi cuenta en dispositivos compartidos. | Botón cerrar sesión → limpieza de cookie → redirect a /login. |

---

## 3.2 Staff – Jugadores

| ID | Historia | Criterios de Aceptación |
|----|----------|-------------------------|
| US-STF-J01 | Como **staff**, quiero **cargar jugadores** con DNI, nombre, fecha de nacimiento y categoría para que puedan usar la app. | Formulario con validación. DNI único. Lista actualizada tras crear. |
| US-STF-J02 | Como **staff**, quiero **ver el listado de jugadores** con su categoría para tener una vista general. | Tabla con DNI, nombre, fecha nac., categoría. |

---

## 3.3 Staff – Ejercicios

| ID | Historia | Criterios de Aceptación |
|----|----------|-------------------------|
| US-STF-E01 | Como **staff**, quiero **crear ejercicios en el catálogo** para usarlos en rutinas. | Formulario completo. Nombre, series, RIR, reps default, tipo, músculo, modo serie, ayuda al alumno. |
| US-STF-E02 | Como **staff**, quiero **editar y eliminar ejercicios** del catálogo para mantenerlos actualizados. | Editar: form pre-poblado. Eliminar: confirmación implícita. |
| US-STF-E03 | Como **staff**, quiero **listar ejercicios** para elegir cuáles agregar a una rutina. | Cards o lista con nombre, tipo, músculo, modo de serie. |

---

## 3.4 Staff – Rutinas

| ID | Historia | Criterios de Aceptación |
|----|----------|-------------------------|
| US-STF-R01 | Como **staff**, quiero **crear rutinas por categoría** con días configurados (partido/descanso/ejercicio) para planificar el entrenamiento. | Form: categoría, nombre, fecha inicio, semanas. Configurar cada día (lun-sáb). |
| US-STF-R02 | Como **staff**, quiero **agregar ejercicios a días de entrenamiento** desde el catálogo para armar la rutina. | Por día "Ejercicio": agregar ejercicios. Configurar series y RIR por semana. |
| US-STF-R03 | Como **staff**, quiero **editar rutinas existentes** para ajustar ejercicios o fechas. | Misma UI que crear. Datos pre-cargados. Guardar actualiza. |
| US-STF-R04 | Como **staff**, quiero **agregar comentarios a ejercicios de rutina** para registrar feedback de jugadores. | Campo de texto por ejercicio. Opción anónimo/nombre. Se listan comentarios. |
| US-STF-R05 | Como **staff**, quiero **ver cuántos comentarios nuevos hay** para no perderme feedback. | Contador en dashboard. Link a rutinas. |

---

## 3.5 Staff – Asistencias

| ID | Historia | Criterios de Aceptación |
|----|----------|-------------------------|
| US-STF-A01 | Como **staff**, quiero **ver asistencias por día** para saber quién asistió en una fecha. | Selector de fecha. Lista: jugador, presente/ausente, RPE si aplica. |
| US-STF-A02 | Como **staff**, quiero **ver asistencias por mes** por jugador para evaluar adherencia. | Selector mes/año. Lista: jugador, días presentes/total, %. Filtro por categoría. |

---

## 3.6 Jugador – Rutina y Entrenamiento

| ID | Historia | Criterios de Aceptación |
|----|----------|-------------------------|
| US-JUG-R01 | Como **jugador**, quiero **ver mi rutina del día** para saber qué ejercicios hacer. | Seleccionar día. Ver ejercicios con series, reps, RIR, ayuda. Semana actual visible. |
| US-JUG-R02 | Como **jugador**, quiero **registrar peso y repeticiones por serie** para llevar seguimiento. | Por ejercicio: campos peso/reps por serie. Marcar completada. Persiste en localStorage. |
| US-JUG-R03 | Como **jugador**, quiero **ver peso sugerido** cuando tengo historial para entrenar con carga adecuada. | Se muestra "Peso sugerido: ~X kg" si hay registros previos. |
| US-JUG-R04 | Como **jugador**, quiero **completar el cuestionario Wellness** (opcional) para que la rutina se adapte si estoy cansado. | 4 preguntas (1-10). Si score < 6: menos series/reps. |
| US-JUG-R05 | Como **jugador**, quiero **indicar el esfuerzo (RPE) y finalizar la jornada** para guardar todo y marcar asistencia. | Escala 1-10. Botón "Finalizar jornada". Envía registros, RPE, asistencia. Redirect a home. |

---

## 3.7 Jugador – Asistencia y Progreso

| ID | Historia | Criterios de Aceptación |
|----|----------|-------------------------|
| US-JUG-A01 | Como **jugador**, quiero **ver mi calendario de asistencias** para saber cuántas veces asistí. | Calendario mensual. Verde: asistí. Rojo: partido sin asistir. Azul: día partido. |
| US-JUG-P01 | Como **jugador**, quiero **ver mi progreso por ejercicio** para ver evolución de cargas. | Lista de ejercicios con registros. Último peso×reps y fecha. |
| US-JUG-P02 | Como **jugador**, quiero **ver el historial detallado de un ejercicio** para analizar mi evolución. | Peso máx, reps máx, total series. Registros agrupados por fecha. |
| US-JUG-P03 | Como **jugador**, quiero **usar la calculadora de 1RM** para estimar mi máximo. | Input: peso, reps. Output: 1RM estimado. Inversa: 1RM + reps → peso sugerido. |

---

## 3.8 Jugador – Perfil y Navegación

| ID | Historia | Criterios de Aceptación |
|----|----------|-------------------------|
| US-JUG-N01 | Como **jugador**, quiero **acceder rápido a marcar asistencia, ver rutina y progreso** desde el inicio. | Home con 3 acciones principales claras. |
| US-JUG-N02 | Como **jugador**, quiero **ver mi perfil y cerrar sesión** para gestionar mi cuenta. | Página perfil con info básica y botón cerrar sesión. |

---

# Resumen de Dependencias

```
00-overview (base)
    ↓
01-users (auth)
    ↓
02-ejercicios (catálogo)
    ↓
03-rutinas (usa plantillas)
    ↓
Asistencias, Progreso, Wellness, RPE
```

---

# Glosario

| Término | Definición |
|---------|------------|
| **RIR** | Reps in Reserve – repeticiones que quedan en reserva antes del fallo |
| **RPE** | Rate of Perceived Exertion – esfuerzo percibido (1-10) |
| **1RM** | Una repetición máxima – peso máximo para una repetición |
| **Wellness** | Cuestionario de bienestar (sueño, energía, dolor, estrés) |
| **Plantilla** | Ejercicio del catálogo (template) usado para crear ejercicios en rutinas |
