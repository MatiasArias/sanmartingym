import { redis } from '@/lib/redis-client';
export {
  MUSCULOS_LESION,
  CONTEXTOS_LESION,
  TIPOS_LESION,
  type MusculoLesion,
  type ContextoLesion,
  type TipoLesion,
} from '@/lib/lesiones-constants';

// ─── Modelo ───────────────────────────────────────────────────────────────────

export interface Lesion {
  id: string;
  jugador_id: string;
  musculo: string;
  contexto: string;
  tipo: string;
  fecha_inicio: string;
  fecha_alta: string | null;
  notas: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Helpers de clave ─────────────────────────────────────────────────────────

function keyLesion(id: string) {
  return `lesion:${id}`;
}

function keyLesionesJugador(jugadorId: string) {
  return `lesiones:jugador:${jugadorId}`;
}

function generateId(): string {
  return `lesion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function getLesionById(id: string): Promise<Lesion | null> {
  return (await redis.get(keyLesion(id))) as Lesion | null;
}

export async function getLesionesByJugador(jugadorId: string): Promise<Lesion[]> {
  const ids = (await redis.lrange(keyLesionesJugador(jugadorId), 0, -1)) as string[];
  if (!ids.length) return [];
  const lesiones = await Promise.all(ids.map((id) => redis.get(keyLesion(id))));
  return lesiones.filter((l): l is Lesion => l != null) as Lesion[];
}

export async function getAllLesiones(): Promise<Lesion[]> {
  const keys = await redis.keys('lesion:lesion-*');
  if (!keys.length) return [];
  const lesiones = await Promise.all(keys.map((k) => redis.get(k)));
  return (lesiones.filter((l): l is Lesion => l != null && typeof l === 'object' && 'id' in l) as Lesion[]).sort(
    (a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio)
  );
}

export async function getLesionesEnRango(desde: string, hasta: string): Promise<Lesion[]> {
  const todas = await getAllLesiones();
  return todas.filter((l) => l.fecha_inicio >= desde && l.fecha_inicio <= hasta);
}

export interface CreateLesionInput {
  jugador_id: string;
  musculo: string;
  contexto: string;
  tipo: string;
  fecha_inicio: string;
  notas?: string;
}

export async function createLesion(input: CreateLesionInput): Promise<Lesion> {
  const now = new Date().toISOString();
  const id = generateId();
  const lesion: Lesion = {
    id,
    jugador_id: input.jugador_id,
    musculo: input.musculo,
    contexto: input.contexto,
    tipo: input.tipo,
    fecha_inicio: input.fecha_inicio,
    fecha_alta: null,
    notas: input.notas ?? '',
    activa: true,
    created_at: now,
    updated_at: now,
  };
  await redis.set(keyLesion(id), lesion);
  await redis.lpush(keyLesionesJugador(input.jugador_id), id);
  return lesion;
}

export interface UpdateLesionInput {
  musculo?: string;
  contexto?: string;
  tipo?: string;
  fecha_inicio?: string;
  fecha_alta?: string | null;
  notas?: string;
}

export async function updateLesion(id: string, input: UpdateLesionInput): Promise<Lesion | null> {
  const lesion = await getLesionById(id);
  if (!lesion) return null;
  const updated: Lesion = {
    ...lesion,
    musculo: input.musculo ?? lesion.musculo,
    contexto: input.contexto ?? lesion.contexto,
    tipo: input.tipo ?? lesion.tipo,
    fecha_inicio: input.fecha_inicio ?? lesion.fecha_inicio,
    notas: input.notas !== undefined ? input.notas : lesion.notas,
    updated_at: new Date().toISOString(),
    // fecha_alta: si se pasa explícitamente (incluso null)
    fecha_alta: 'fecha_alta' in input ? (input.fecha_alta ?? null) : lesion.fecha_alta,
    activa: 'fecha_alta' in input ? input.fecha_alta == null : lesion.activa,
  };
  await redis.set(keyLesion(id), updated);
  return updated;
}

export async function darAltaLesion(id: string, fecha: string): Promise<Lesion | null> {
  return updateLesion(id, { fecha_alta: fecha });
}
