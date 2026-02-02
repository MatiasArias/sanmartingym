# Feature: Rutinas (Create/Edit)

## Status
- [x] Specified
- [x] Implemented
- [ ] Tested
- [ ] Deployed

## Dependencies
- **Requires**: Users (01-users.md), Ejercicios (02-ejercicios.md), Categorías
- **Blocks**: Ninguno

## Overview

El staff crea y edita rutinas por categoría. Formulario intuitivo con 6 días (lunes a sábado), cada día configurable como partido/descanso/ejercicio. Los ejercicios tienen **config de series y RIR por semana**.

## Rutina - Propiedades

- **id**, **categoria_id**, **nombre**
- **fecha_inicio**: YYYY-MM-DD
- **semanas**: número (duración)
- **fecha_fin**: calculado (fecha_inicio + semanas*7)
- **dias_config**: { lunes: 'partido'|'descanso'|'ejercicio', ... }

## Tipo de día

- **Partido**: Día de partido (sin entrenamiento)
- **Descanso**: Día de descanso
- **Ejercicio**: Día de entrenamiento (con lista de ejercicios)

## Ejercicio en Rutina

- **ejercicio_plantilla_id**
- **dia**
- **orden**
- **config_por_semana**: { 1: { series, rir }, 2: { series, rir }, ... }
  - Cada semana puede tener distintas series y RIR (progresión)

## Flujo del formulario

1. Datos básicos: categoría, nombre, fecha inicio, **semanas**
2. Sección de 6 días (lunes a sábado)
3. Por día: click en (+) o "Configurar" → elegir Partido | Descanso | Ejercicio
4. Si Ejercicio: agregar ejercicios del catálogo
5. Por cada ejercicio: configurar **series y RIR por semana** (Sem 1, Sem 2, ...)

## Jugador

- Ve la rutina según **semana actual** (calculada desde fecha_inicio)
- Series y RIR se resuelven de config_por_semana[semana_actual]
- Indica "Semana X" en la cabecera

---

Last updated: 2026-02-02
