# San Martín Gym - Especificaciones

Especificación modular del proyecto.

## Documento Maestro

### [SPECS-COMPLETAS.md](./SPECS-COMPLETAS.md)
Especificaciones completas y consolidadas: requisitos funcionales por módulo, no funcionales, user stories.

---

## Índice de Specs Modulares (features)

### 00. [Overview](./00-overview.md)
Contexto general, stack y deployment.

### 01. [Users](./01-users.md)
Usuarios, login por DNI, roles (jugador/staff).

### 02. [Ejercicios](./02-ejercicios.md)
Catálogo de ejercicios (plantillas): nombre, tipo, músculo, modo de serie, ayuda al alumno.

### 03. [Rutinas](./03-rutinas.md)
Creación y edición de rutinas por categoría; ejercicios con config por semana (series, repeticiones, RIR, circuitos).

### 04. [Lesiones](./04-lesiones.md)
Gestión de lesiones por el staff: por jugador (músculo, contexto, tipo), listado activos/inactivos, reporte por fecha con gráficos de torta y PDF.

### 05. [Design tokens](./05-design-tokens.md)
Tokens de diseño (tipografía, espaciado, colores) para UI consistente.

### 06. [Features faltantes](./06-FEATURES-FALTANTES.md)
**Documento maestro de lo pendiente:** gaps de MVP (ej. activar/desactivar jugador), fase 2 (volumen, alertas), pulidos opcionales y features ya especificadas pero no implementadas (lesiones, home referencia, wellness 0–25, etc.).

### 07. [Home jugador (referencia)](./07-home-jugador-referencia.md)
Diseño de referencia para rediseñar la pantalla de inicio del jugador: resumen semanal, estado de entrenamientos, último ejercicio, acciones rápidas.

---

## Roadmap e implementación

### [IMPLEMENTACION-REFACTOR-Y-FEATURES.md](./IMPLEMENTACION-REFACTOR-Y-FEATURES.md)
Plan de implementación: fases 0–5 (config, estabilización, modularización, UX, tests, UI) y features A–D (wellness obligatorio, rutinas/circuitos, rendimiento/PDF, lesiones). Criterios de cierre por fase.

---

## Arquitectura

### [SDD-ARCHITECTURE.md](./SDD-ARCHITECTURE.md)
Arquitectura y convenciones del proyecto (si aplica).

---

## Dependencias entre specs (features)

```
00-overview (base)
    ↓
01-users (auth)
    ↓
02-ejercicios (catálogo)
    ↓
03-rutinas (usa ejercicios del catálogo)

04-lesiones (usa usuarios/jugadores)
05-design-tokens (independiente)
06-FEATURES-FALTANTES (índice de pendientes)
07-home-jugador-referencia (UX jugador)
```

---

Last updated: 2026-02-06
