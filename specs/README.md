# San Martín Gym - Especificaciones

Especificación modular del proyecto.

## Documento Maestro

### [SPECS-COMPLETAS.md](./SPECS-COMPLETAS.md)
Especificaciones completas y consolidadas:
- **Funcionales**: requisitos detallados por módulo (auth, jugadores, ejercicios, rutinas, asistencia, progreso)
- **No funcionales**: rendimiento, usabilidad, seguridad, tecnología
- **User Stories**: historias de usuario con criterios de aceptación

---

## Índice de Specs Modulares

### 00. [Overview](./00-overview.md)
Contexto general, stack y deployment.

### 01. [Users](./01-users.md)
Usuarios, login por DNI, roles (jugador/staff).

### 02. [Ejercicios](./02-ejercicios.md)
Catálogo de ejercicios (plantillas) con nombre, tipo, músculo, modo de serie, ayuda al alumno.

### 03. [Rutinas](./03-rutinas.md)
Creación y edición de rutinas. Los ejercicios se agregan desde el catálogo (solo series modificable).

---

## Dependencias

```
00-overview (base)
    ↓
01-users (auth)
    ↓
02-ejercicios (catálogo)
    ↓
03-rutinas (usa ejercicios del catálogo)
```

---

Last updated: 2026-02-02
