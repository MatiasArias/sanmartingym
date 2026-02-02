# Arquitectura SDD - San Martín Gym

## Mapeo Spec → Código

| Spec | Archivos |
|------|----------|
| 00-overview | README, package.json |
| 01-users | lib/auth.ts, app/api/auth/, app/login/ |
| 02-ejercicios | lib/redis.ts, app/api/staff/ejercicios/, app/(staff)/dashboard/ejercicios/ |
| 03-rutinas | lib/redis.ts, app/api/staff/rutinas/, app/(staff)/dashboard/rutinas/ |

## Grafo de Dependencias

```
00-overview (base)
    ↓
01-users (auth)
    ↓
02-ejercicios (catálogo)
    ↓
03-rutinas (usa plantillas)
```

---

Last updated: 2026-02-02
