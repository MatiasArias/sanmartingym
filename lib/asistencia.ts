import { iterarDiasEntre } from '@/lib/fecha';
import { redis } from '@/lib/redis-client';

export interface Asistencia {
  id: string;
  usuario_id: string;
  fecha: string;
  timestamp: string;
}

export interface RpeSesion {
  usuario_id: string;
  fecha: string;
  rutina_id: string;
  dia: string;
  rpe: number;
  timestamp: string;
}

export async function getAsistenciasPorFecha(fecha: string): Promise<Asistencia[]> {
  const keys = await redis.keys('asistencia:*');
  const asistencias = (await Promise.all(keys.map((k) => redis.get(k)))) as (Asistencia | null)[];
  return asistencias.filter((a) => a && a.fecha === fecha) as Asistencia[];
}

export async function getAsistenciasJugadorEnRango(
  jugadorId: string,
  fechaDesde: string,
  fechaHasta: string
): Promise<string[]> {
  const fechas: string[] = [];
  for (const fecha of iterarDiasEntre(fechaDesde, fechaHasta)) {
    const key = `asistencia:${jugadorId}:${fecha}`;
    const val = await redis.get(key);
    if (val) fechas.push(fecha);
  }
  return fechas;
}

export async function saveRpeSesion(data: RpeSesion): Promise<void> {
  const key = `rpe_sesion:${data.usuario_id}:${data.fecha}`;
  await redis.set(key, data);
}

export async function getRpeSesion(usuarioId: string, fecha: string): Promise<RpeSesion | null> {
  const key = `rpe_sesion:${usuarioId}:${fecha}`;
  return (await redis.get(key)) as RpeSesion | null;
}

/** RPE de sesión del jugador en un rango de fechas (para reportes/rendimiento). */
export async function getRpeSesionesEnRango(
  usuarioId: string,
  desde: string,
  hasta: string
): Promise<{ fecha: string; rpe: number }[]> {
  const pattern = `rpe_sesion:${usuarioId}:*`;
  const keys = await redis.keys(pattern);
  const inRange = keys.filter((k) => {
    const fecha = k.split(':').pop() ?? '';
    return fecha >= desde && fecha <= hasta;
  });
  const values = (await Promise.all(inRange.map((k) => redis.get(k)))) as (RpeSesion | null)[];
  return values
    .filter((v): v is RpeSesion => v != null && typeof v === 'object' && 'rpe' in v)
    .map((v) => ({ fecha: v.fecha, rpe: v.rpe }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
