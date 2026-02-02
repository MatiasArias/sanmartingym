# San Martín Gym – Especificación (MVP)

## 0. Contexto

- App para gimnasio de fútbol (San Martín)
- Jugadores ven rutinas según su categoría
- Staff gestiona rutinas, ejercicios y asistencia
- Mobile-first
- Redis como base de datos
- Despliegue en Vercel

---

## 1. Objetivo

App web para que jugadores vean sus rutinas de entrenamiento, registren cargas y marquen asistencia. El staff crea y edita rutinas por categoría.

---

## 2. Features Principales

### 2.1 Usuarios
- Login por DNI
- Roles: jugador | staff
- Jugadores tienen categoría asignada (M15, M17, Primera, Femenino)
- JWT para autenticación

### 2.2 Rutinas
- Por categoría
- Campos: nombre, fecha_inicio, fecha_fin
- Solo una rutina activa por categoría (fecha actual dentro del rango)
- **Crear** y **editar** rutinas (staff)

### 2.3 Ejercicios
- Pertenen a una rutina
- Campos: dia, nombre, series, repeticiones, rir, orden
- Días: lunes, martes, miércoles, jueves, viernes, sábado, domingo
- Staff puede agregar, editar y eliminar ejercicios

### 2.4 Asistencia
- Jugadores marcan asistencia diaria
- Staff puede ver lista de asistencias por fecha

### 2.5 Registros de carga
- Jugadores registran peso/reps por serie
- Historial de progreso por ejercicio

---

## 3. Modelo de Datos (Redis)

### Estructura
- `usuario:{id}` – Usuario
- `usuario:dni:{dni}` – Índice por DNI
- `categoria:{id}` – Categoría (M15, M17, etc.)
- `rutina:{id}` – Rutina
- `rutinas:categoria:{categoria_id}` – Lista de rutinas por categoría
- `ejercicio:{id}` – Ejercicio
- `ejercicios:rutina:{rutina_id}` – Lista de ejercicios por rutina
- `registros:jugador:{jugador_id}` – Registros de carga
- `asistencia:{id}` – Asistencia

---

## 4. Stack Tecnológico

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Redis** (ioredis)
- **JWT** (jose)
- **Zod** (validación)

---

## 5. Páginas

### Jugador
- `/` (redirect según rol)
- `/home` – Inicio jugador
- `/rutina` – Rutina activa por día
- `/asistencia` – Marcar asistencia
- `/progreso` – Progreso por ejercicio
- `/perfil` – Perfil
- `/comentarios` – Comentarios

### Staff
- `/dashboard` – Dashboard
- `/dashboard/rutinas` – Lista rutinas por categoría
- `/dashboard/rutinas/nuevo` – Crear rutina
- `/dashboard/rutinas/[id]` – Ver rutina
- `/dashboard/rutinas/[id]/editar` – Editar rutina
- `/dashboard/asistencias` – Ver asistencias

---

Last updated: 2026-02-02
