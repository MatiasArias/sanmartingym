/**
 * Constantes de lesiones – sin dependencias de servidor (Redis/ioredis).
 * Se puede importar tanto desde Client Components como desde Server Components.
 */

export const MUSCULOS_LESION = [
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Gemelos',
  'Aductores',
  'Pectorales',
  'Hombro',
  'Codo',
  'Muñeca',
  'Lumbar',
  'Cervical',
  'Core',
  'Otro',
] as const;

export const CONTEXTOS_LESION = ['Entrenamiento', 'Partido', 'Recuperación', 'Otro'] as const;

export const TIPOS_LESION = [
  'Esguince',
  'Contractura',
  'Desgarro',
  'Tendinitis',
  'Contusión',
  'Sobrecarga',
  'Otro',
] as const;

export type MusculoLesion = (typeof MUSCULOS_LESION)[number];
export type ContextoLesion = (typeof CONTEXTOS_LESION)[number];
export type TipoLesion = (typeof TIPOS_LESION)[number];
