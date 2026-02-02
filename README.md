# sanmartingym

## Seguridad: credenciales

**No subas nunca credenciales a GitHub.** Usa solo:

- **Local:** archivo `.env.local` (está en `.gitignore`, no se sube).
- **Producción (Vercel):** variables de entorno en el panel de Vercel.

El repositorio solo debe incluir `.env.example` con placeholders (sin contraseñas ni URLs reales).

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Editar .env.local: REDIS_URL (redis://...) y JWT_SECRET
npm run dev
```

## Redis

La app usa **Redis estándar** (Redis Labs, self-hosted, etc.) con una URL de conexión:

- **REDIS_URL** o **SANMARTIN_REDIS_URL**: `redis://default:password@host:puerto`  
  Ejemplo: `redis://default:tuPassword@redis-xxxx.cloud.redislabs.com:17931`

En Vercel puedes usar **SANMARTIN_REDIS_URL** (o **REDIS_URL**); la app acepta cualquiera de las dos.

## Datos de prueba (seed)

Para tener usuarios, rutinas y progreso de ejemplo:

```bash
npm run seed
```

Usa `REDIS_URL` (o `SANMARTIN_REDIS_URL`) de `.env.local`. Incluye:

- **10 ejercicios** (plantillas + ejercicios en rutina M17): Sentadilla, Press Banca, Remo, Peso Muerto, Press Militar, Dominadas, Sentadilla Frontal, Press Inclinado, Peso Muerto Rumano, Curl de Bíceps.
- **Rutina activa:** "Fuerza - Semana 1" (2026-01-13 a 2026-02-13).
- **Juan Pérez** (DNI `45123456`) con **un mes de progreso**: 10 asistencias y registros de carga (peso/reps) en lunes, miércoles y viernes.
- **Staff:** DNI `20345678` (Lucas Salvador).

## Despliegue (Vercel, etc.)

1. En Vercel asegúrate de tener **SANMARTIN_REDIS_URL** (o **REDIS_URL**) y **JWT_SECRET** para producción.
2. Después de desplegar, la base Redis suele estar vacía. Ejecuta el seed **desde tu máquina** con la misma URL:

   **PowerShell (Windows):**
   ```powershell
   $env:SANMARTIN_REDIS_URL="redis://default:tuPassword@host:puerto"
   npm run seed
   ```

   **Bash (Linux/Mac):**
   ```bash
   SANMARTIN_REDIS_URL="redis://default:tuPassword@host:puerto" npm run seed
   ```

3. Prueba el login en la app desplegada con DNI `45123456` (jugador) o `20345678` (staff).
