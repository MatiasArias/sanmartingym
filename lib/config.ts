import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z
    .string()
    .optional()
    .transform((v) => {
      const env = process.env.NODE_ENV ?? 'development';
      if (env === 'development' || env === 'test') {
        if (!v || v.length < 32) {
          if (env !== 'test') {
            console.warn('[config] JWT_SECRET no definido o corto en desarrollo; usando valor por defecto. Define JWT_SECRET en .env.local para producción.');
          }
          return 'dev-only-secret-min-32-chars-do-not-use-in-prod';
        }
        return v;
      }
      if (!v || v.length < 32) {
        throw new Error('JWT_SECRET debe tener al menos 32 caracteres por seguridad');
      }
      return v;
    }),
  REDIS_URL: z.string().url().optional(),
  SANMARTIN_REDIS_URL: z.string().url().optional(),
  APP_NAME: z.string().optional().default('San Martín Gym'),
  WELLNESS_OBLIGATORIO: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  REPORTE_PDF_HABILITADO: z
    .string()
    .optional()
    .transform((v) => v === undefined || v === '' || v === 'true' || v === '1'),
});

function getEnv() {
  // Durante `next build` los módulos se evalúan estáticamente pero no se
  // ejecutan requests reales; no validar vars de entorno para no bloquear el build.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return {
      NODE_ENV: 'production' as const,
      JWT_SECRET: 'build-time-placeholder-not-used-at-runtime',
      REDIS_URL: undefined as string | undefined,
      SANMARTIN_REDIS_URL: undefined as string | undefined,
      APP_NAME: 'San Martín Gym',
      WELLNESS_OBLIGATORIO: false,
      REPORTE_PDF_HABILITADO: true,
    };
  }

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    SANMARTIN_REDIS_URL: process.env.SANMARTIN_REDIS_URL,
    APP_NAME: process.env.APP_NAME,
    WELLNESS_OBLIGATORIO: process.env.WELLNESS_OBLIGATORIO,
    REPORTE_PDF_HABILITADO: process.env.REPORTE_PDF_HABILITADO,
  });

  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Configuración inválida: ${msg}`);
  }

  return parsed.data;
}

const raw = getEnv();

/** URL de Redis: prioridad SANMARTIN_REDIS_URL, luego REDIS_URL. Obligatoria en runtime para usar Redis. */
export const redisUrl: string =
  raw.SANMARTIN_REDIS_URL ?? raw.REDIS_URL ?? '';

/** Secreto JWT. Validado al cargar: no hay fallback; si falta, el proceso lanza error. */
export const jwtSecret = raw.JWT_SECRET;

/** Nombre de la aplicación (opcional). */
export const appName = raw.APP_NAME;

/** Entorno Node. */
export const nodeEnv = raw.NODE_ENV;

/** Si true, el jugador debe completar wellness del día antes de ver ejercicios. */
export const wellnessObligatorio = raw.WELLNESS_OBLIGATORIO ?? false;

/** Si true, se muestra el botón de descargar reporte PDF en rendimiento. */
export const reportePdfHabilitado = raw.REPORTE_PDF_HABILITADO ?? true;

/** Objeto de configuración tipado (para inyección o tests). */
export const config = {
  redisUrl,
  jwtSecret,
  appName,
  nodeEnv,
  wellnessObligatorio,
  reportePdfHabilitado,
} as const;
