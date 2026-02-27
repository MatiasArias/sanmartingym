/**
 * Constantes de negocio para validaciones y formularios.
 * Usar en schemas Zod y en UI para mantener consistencia.
 */

/** DNI: longitud mínima y máxima (Argentina típico 7-8 dígitos). */
export const DNI_MIN_LENGTH = 7;
export const DNI_MAX_LENGTH = 8;

/** Rutina: rango de semanas permitido. */
export const RUTINA_SEMANAS_MIN = 1;
export const RUTINA_SEMANAS_MAX = 52;

/** Wellness: escala de puntaje (suma de 5 preguntas 1-5 = 5-25, o escalado 0-25). */
export const WELLNESS_SCORE_MIN = 0;
export const WELLNESS_SCORE_MAX = 25;

/** Músculos/grupos musculares predefinidos para el catálogo de ejercicios. */
export const MUSCULOS_DEFAULT = [
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Pectorales',
  'Dorsales',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Core',
  'Gemelos',
  'Otro',
] as const;

export type MusculoPrincipal = (typeof MUSCULOS_DEFAULT)[number];
