# Feature: Catálogo de Ejercicios (EJERCICIOS)

## Status
- [x] Specified
- [x] Implemented
- [ ] Tested
- [ ] Deployed

## Dependencies
- **Requires**: Overview (00-overview.md), Users (01-users.md)
- **Blocks**: Rutinas (03-rutinas.md)

## Overview

Sección de configuración del staff para gestionar el catálogo de ejercicios. Cada ejercicio es una plantilla con datos por defecto que se usa al agregarlo a una rutina.

## Propiedades del Ejercicio (Plantilla)

- **nombre**: string - Nombre del ejercicio
- **series_default**: number - Cantidad de series por defecto
- **rir_default**: number - RIR (Reps in Reserve) por defecto
- **repeticiones_default**: number - Repeticiones/valor por defecto (según modo)
- **tipo**: 'empuje' | 'traccion' - Tipo de ejercicio
- **musculo_principal**: string - Músculo principal trabajado
- **modo_serie**: 
  - `serie_x_repeticion` - Series × Repetición (ej: 4×10)
  - `serie_x_minutos` - Series × Minutos (ej: 3×2min)
  - `serie_x_brazo` - Series × Brazo (ej: 3× cada brazo)
- **ayuda_alumno**: string - Tips e instrucciones para el alumno

## Capabilities

- ✅ Listar ejercicios del catálogo
- ✅ Crear ejercicio
- ✅ Editar ejercicio
- ✅ Eliminar ejercicio

## Permissions

- Solo **staff** puede gestionar el catálogo

## API Contracts

### GET /api/staff/ejercicios
**Response:** `{ ejercicios: EjercicioPlantilla[] }`

### POST /api/staff/ejercicios
**Request:** Body con todas las propiedades del ejercicio

**Response:** `{ ejercicio: EjercicioPlantilla }`

### GET /api/staff/ejercicios/[id]
**Response:** `{ ejercicio: EjercicioPlantilla }`

### PUT /api/staff/ejercicios/[id]
**Request:** Body con propiedades a actualizar

**Response:** `{ ejercicio: EjercicioPlantilla }`

### DELETE /api/staff/ejercicios/[id]
**Response:** `{ success: true }`

## UI/UX

- **Lista** (/dashboard/ejercicios): Cards con nombre, tipo, músculo, modo de serie, series default
- **Crear** (/dashboard/ejercicios/nuevo): Formulario completo
- **Editar** (/dashboard/ejercicios/[id]/editar): Mismo form pre-poblado + botón Eliminar

## Músculos predefinidos

Cuádriceps, Isquiotibiales, Glúteos, Pectorales, Dorsales, Hombros, Bíceps, Tríceps, Core, Gemelos, Otro

---

Last updated: 2026-02-02
