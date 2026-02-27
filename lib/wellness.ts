import { redis } from '@/lib/redis-client';
import { WELLNESS_SCORE_MIN, WELLNESS_SCORE_MAX } from '@/lib/constants';

export interface WellnessSesion {
  usuario_id: string;
  fecha: string;
  score: number;
  respuestas: Record<string, number>;
  timestamp: string;
}

export interface ReglaWellness {
  metric: 'score';
  operator: '<' | '<=';
  threshold: number;
  action: 'quitar_reps' | 'quitar_series';
  amount: number;
}

const WELLNESS_RULES_KEY = 'config:wellness-rules';
const WELLNESS_KEY_PREFIX = 'wellness:';

function normalizarRegla(r: unknown): ReglaWellness | null {
  if (!r || typeof r !== 'object') return null;
  const o = r as Record<string, unknown>;
  const operator = (o.operator === '<' || o.operator === '<=') ? o.operator : '<';
  const action = (o.action === 'quitar_reps' || o.action === 'quitar_series') ? o.action : 'quitar_reps';
  const amount = Math.min(5, Math.max(1, Number(o.amount) || 1));
  let threshold = Number(o.threshold) || 10;
  const metric = o.metric as string;
  if (metric === 'bienestar' || metric === 'cansancio') {
    threshold = Math.round(threshold * 5);
  }
  threshold = Math.min(WELLNESS_SCORE_MAX, Math.max(WELLNESS_SCORE_MIN, threshold));
  return { metric: 'score', operator, threshold, action, amount };
}

export async function getWellnessRules(): Promise<ReglaWellness[]> {
  const data = await redis.get(WELLNESS_RULES_KEY);
  if (data && Array.isArray(data) && data.length > 0) {
    const normalizadas = (data as unknown[]).map(normalizarRegla).filter(Boolean) as ReglaWellness[];
    if (normalizadas.length > 0) return normalizadas;
  }
  return [
    { metric: 'score', operator: '<', threshold: 10, action: 'quitar_reps', amount: 1 },
    { metric: 'score', operator: '<', threshold: 8, action: 'quitar_series', amount: 1 },
  ]; // umbrales en escala 0–25
}

export async function setWellnessRules(rules: ReglaWellness[]): Promise<void> {
  await redis.set(WELLNESS_RULES_KEY, rules);
}

export async function saveWellnessSesion(data: WellnessSesion): Promise<void> {
  const key = `${WELLNESS_KEY_PREFIX}${data.usuario_id}:${data.fecha}`;
  await redis.set(key, data);
}

export async function getWellnessSesion(usuarioId: string, fecha: string): Promise<WellnessSesion | null> {
  const key = `${WELLNESS_KEY_PREFIX}${usuarioId}:${fecha}`;
  return (await redis.get(key)) as WellnessSesion | null;
}

/** Sesiones de wellness del jugador en un rango de fechas (para reportes/rendimiento). */
export async function getWellnessSesionesEnRango(
  usuarioId: string,
  desde: string,
  hasta: string
): Promise<WellnessSesion[]> {
  const pattern = `${WELLNESS_KEY_PREFIX}${usuarioId}:*`;
  const keys = await redis.keys(pattern);
  const inRange = keys.filter((k) => {
    const fecha = k.split(':').pop() ?? '';
    return fecha >= desde && fecha <= hasta;
  });
  const values = (await Promise.all(inRange.map((k) => redis.get(k)))) as (WellnessSesion | null)[];
  return values.filter((v): v is WellnessSesion => v != null && typeof v === 'object' && 'fecha' in v);
}
