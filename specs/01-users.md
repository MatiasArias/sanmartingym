# Feature: Usuarios

## Status
- [x] Specified
- [x] Implemented
- [ ] Tested
- [ ] Deployed

## Dependencies
- **Requires**: Overview (00-overview.md)
- **Blocks**: Rutinas (02-rutinas.md)

## Overview

Login por DNI, roles jugador/staff, categorías para jugadores.

## Data Model

```typescript
interface Usuario {
  id: string;
  dni: string;
  nombre: string;
  rol: 'jugador' | 'staff';
  categoria_id?: string;
  activo: boolean;
}
```

## Auth Flow

1. POST /api/auth/login con { dni }
2. Buscar usuario por DNI
3. Crear JWT con { id, rol }
4. Set cookie auth_token
5. Redirect según rol (staff → /dashboard, jugador → /home)

---

Last updated: 2026-02-02
