# Overview - San Martín Gym

## Status
- [x] Specified
- [x] Implemented
- [ ] Tested
- [ ] Deployed

## Contexto

- App para gimnasio de fútbol
- Jugadores: ven rutinas, marcan asistencia, registran cargas
- Staff: crea/edita rutinas, ve asistencias
- Mobile-first
- Redis como persistencia

## Objetivo

Gestionar rutinas de entrenamiento por categoría y permitir a los jugadores seguir sus rutinas y registrar progreso.

## Stack Tecnológico

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS

### Backend
- Redis (ioredis)
- API routes en Next.js

### Auth
- Login por DNI
- JWT (jose) en cookie
- Roles: jugador | staff

### Deployment
- Vercel

## Variables de Entorno

```
SANMARTIN_REDIS_URL=redis://...
REDIS_URL=redis://...
JWT_SECRET=...
```

## Estructura del Repositorio

```
├── app/
│   ├── (jugador)/     # Rutas jugador
│   ├── (staff)/       # Rutas staff
│   ├── api/           # API routes
│   └── login/
├── lib/
│   ├── auth.ts
│   └── redis.ts
├── specs/             # Especificaciones
└── scripts/
```

---

Last updated: 2026-02-02
