import { redis } from '@/lib/redis-client';

export interface ComentarioEjercicio {
  id: string;
  ejercicio_id: string;
  texto: string;
  timestamp: string;
  anonimo: boolean;
  usuario_nombre?: string;
  resuelto?: boolean;
  resuelto_at?: string;
}

export interface ComentarioResuelto extends ComentarioEjercicio {
  ejercicio_nombre: string;
  resuelto_at: string;
}

const COMENTARIOS_KEY_PREFIX = 'comentarios:ejercicio:';
const COMENTARIOS_INDICE_KEY = 'comentarios:indice';
const COMENTARIOS_RESUELTOS_KEY = 'comentarios:resueltos';
const STAFF_ULTIMA_VISTA_PREFIX = 'staff:ultima_vista_comentarios:';

export async function addComentarioEjercicio(
  data: Omit<ComentarioEjercicio, 'id'> & { anonimo: boolean; usuario_nombre?: string }
): Promise<ComentarioEjercicio> {
  const comentario: ComentarioEjercicio = {
    ...data,
    id: `comentario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  const key = `${COMENTARIOS_KEY_PREFIX}${data.ejercicio_id}`;
  await redis.lpush(key, comentario);
  const ts = new Date(comentario.timestamp).getTime();
  await redis.zadd(COMENTARIOS_INDICE_KEY, ts, comentario.id);
  return comentario;
}

export async function getComentariosByEjercicio(
  ejercicioId: string,
  soloNoResueltos = false
): Promise<ComentarioEjercicio[]> {
  const key = `${COMENTARIOS_KEY_PREFIX}${ejercicioId}`;
  const comentarios = (await redis.lrange(key, 0, -1)) as ComentarioEjercicio[];
  let list = comentarios || [];
  if (soloNoResueltos) list = list.filter((c) => !c.resuelto);
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getComentariosByEjercicios(
  ejercicioIds: string[]
): Promise<Record<string, ComentarioEjercicio[]>> {
  const result: Record<string, ComentarioEjercicio[]> = {};
  await Promise.all(
    ejercicioIds.map(async (id) => {
      result[id] = await getComentariosByEjercicio(id);
    })
  );
  return result;
}

export async function getComentariosNoResueltosByEjercicios(
  ejercicioIds: string[]
): Promise<Record<string, ComentarioEjercicio[]>> {
  const result: Record<string, ComentarioEjercicio[]> = {};
  await Promise.all(
    ejercicioIds.map(async (id) => {
      result[id] = await getComentariosByEjercicio(id, true);
    })
  );
  return result;
}

export async function markComentarioResuelto(
  comentarioId: string,
  ejercicioId: string,
  ejercicioNombre: string
): Promise<void> {
  const key = `${COMENTARIOS_KEY_PREFIX}${ejercicioId}`;
  const comentarios = (await redis.lrange(key, 0, -1)) as ComentarioEjercicio[];
  const resueltoAt = new Date().toISOString();
  const actualizados = comentarios.map((c) =>
    c.id === comentarioId ? { ...c, resuelto: true, resuelto_at: resueltoAt } : c
  );
  await redis.del(key);
  for (const c of actualizados.reverse()) {
    await redis.lpush(key, c);
  }
  const comentario = actualizados.find((c) => c.id === comentarioId);
  if (comentario) {
    const paraHistorial: ComentarioResuelto = {
      ...comentario,
      ejercicio_nombre: ejercicioNombre,
      resuelto_at: resueltoAt,
    };
    await redis.lpush(COMENTARIOS_RESUELTOS_KEY, paraHistorial);
  }
  await redis.zrem(COMENTARIOS_INDICE_KEY, comentarioId);
}

export async function getComentariosResueltos(): Promise<ComentarioResuelto[]> {
  const comentarios = (await redis.lrange(COMENTARIOS_RESUELTOS_KEY, 0, -1)) as ComentarioResuelto[];
  return (comentarios || []).sort(
    (a, b) =>
      new Date(b.resuelto_at || b.timestamp).getTime() -
      new Date(a.resuelto_at || a.timestamp).getTime()
  );
}

export async function getComentariosNuevosCount(staffUserId: string): Promise<number> {
  const lastViewed = (await redis.get(`${STAFF_ULTIMA_VISTA_PREFIX}${staffUserId}`)) as
    | number
    | string
    | null;
  if (!lastViewed) return 0;
  const minScore = typeof lastViewed === 'number' ? lastViewed : parseInt(String(lastViewed), 10) || 0;
  return redis.zcount(COMENTARIOS_INDICE_KEY, minScore + 1, '+inf');
}

export async function marcarComentariosVistos(staffUserId: string): Promise<void> {
  await redis.set(`${STAFF_ULTIMA_VISTA_PREFIX}${staffUserId}`, Date.now());
}
