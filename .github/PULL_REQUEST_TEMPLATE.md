## Resumen

Esta PR extiende las funcionalidades del panel de staff y mejora la experiencia de jugadores en la app San Martín Gym, incluyendo un fix para que la rutina no quede bloqueada en producción.

## Cambios principales

### Staff - Panel de jugadores
- **Vista de rendimiento por jugador** (`/dashboard/jugadores/[id]/rendimiento`): el staff puede consultar historial de cargas, asistencia y RM relativa por ejercicio
- **API PATCH** `/api/staff/jugadores/[id]`: permite actualizar el peso corporal del jugador
- **API GET** `/api/staff/jugadores/[id]/rendimiento`: devuelve los datos de rendimiento para la vista

### Staff - Rutinas y wellness
- Mejoras en formularios de rutinas y reglas wellness
- Actualización de endpoints de rutinas y wellness-rules

### Jugador
- **Cuestionario wellness opcional**: el cuestionario se muestra como opcional, con posibilidad de omitirlo y ver la rutina completa (fix para evitar bloqueos en producción)
- Mejoras en `RutinaClient` y flujo de rutina diaria

### Infraestructura / Otros
- Script `scripts/cleanup-produccion.mjs` para limpieza de datos en producción
- Ajustes en `lib/redis.ts` y `lib/rutina-storage.ts`
- Verificación defensiva de `payload` en rutina y redirección a login cuando no hay sesión
- Template de PR en `.github/PULL_REQUEST_TEMPLATE.md`

## Especificaciones

- Specs actualizadas en `specs/` para reflejar las nuevas funcionalidades

## Checklist

- [x] Código implementado según specs
- [x] Fix de producción (wellness opcional)
- [ ] Tests (pendiente)
- [ ] Deploy (pendiente)
