import { redis } from '@/lib/redis-client';
import type { Ejercicio } from '@/lib/rutinas';

export interface RegistroCarga {
  id: string;
  usuario_id: string;
  ejercicio_id: string;
  peso: number;
  reps: number;
  serie_num: number;
  fecha: string;
  timestamp: string;
}

export async function getRegistrosByJugador(jugadorId: string): Promise<RegistroCarga[]> {
  const registros = (await redis.lrange(`registros:jugador:${jugadorId}`, 0, -1)) as RegistroCarga[];
  return registros || [];
}

export async function getEjerciciosConRegistros(
  jugadorId: string
): Promise<{ ejercicio: Ejercicio; ultimoRegistro: RegistroCarga }[]> {
  const registros = await getRegistrosByJugador(jugadorId);
  const ejerciciosIds = Array.from(new Set(registros.map((r) => r.ejercicio_id)));

  const resultado = [];
  for (const ejId of ejerciciosIds) {
    const ejercicio = (await redis.get(`ejercicio:${ejId}`)) as Ejercicio | null;
    if (ejercicio) {
      const registrosEj = registros.filter((r) => r.ejercicio_id === ejId);
      const ultimo = registrosEj.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      resultado.push({ ejercicio, ultimoRegistro: ultimo });
    }
  }

  return resultado;
}

export async function getHistorialEjercicio(
  jugadorId: string,
  ejercicioId: string
): Promise<RegistroCarga[]> {
  const registros = await getRegistrosByJugador(jugadorId);
  return registros
    .filter((r) => r.ejercicio_id === ejercicioId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
