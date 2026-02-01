import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function getClient(): Redis {
  const url = process.env.SANMARTIN_REDIS_URL || process.env.REDIS_URL;
  if (!url) throw new Error('SANMARTIN_REDIS_URL o REDIS_URL es requerido');
  if (globalThis.__redis) return globalThis.__redis;
  globalThis.__redis = new Redis(url);
  return globalThis.__redis;
}

const client = getClient();

function parse(val: string | null): unknown {
  if (val == null) return null;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

/** Cliente Redis con la misma API que usaba Upstash (get/set/lpush/lrange/keys). Serializa objetos en JSON. */
export const redis = {
  async get(key: string): Promise<unknown> {
    const val = await client.get(key);
    return parse(val);
  },
  async set(key: string, value: unknown): Promise<void> {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    await client.set(key, str);
  },
  async lpush(key: string, ...values: unknown[]): Promise<number> {
    const strValues = values.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
    return client.lpush(key, ...strValues);
  },
  async lrange(key: string, start: number, stop: number): Promise<unknown[]> {
    const arr = await client.lrange(key, start, stop);
    return arr.map((s) => parse(s));
  },
  async keys(pattern: string): Promise<string[]> {
    return client.keys(pattern);
  },
};

// TypeScript types
export interface Usuario {
  id: string;
  dni: string;
  nombre: string;
  rol: 'jugador' | 'staff';
  categoria_id?: string;
  activo: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
}

export interface Rutina {
  id: string;
  categoria_id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface Ejercicio {
  id: string;
  rutina_id: string;
  dia: string;
  nombre: string;
  series: number;
  repeticiones: number;
  rir: number;
  orden: number;
}

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

export interface Asistencia {
  id: string;
  usuario_id: string;
  fecha: string;
  timestamp: string;
}

// Helper functions
export async function getUsuarioByDni(dni: string): Promise<Usuario | null> {
  return (await redis.get(`usuario:dni:${dni}`)) as Usuario | null;
}

export async function getUsuarioById(id: string): Promise<Usuario | null> {
  return (await redis.get(`usuario:${id}`)) as Usuario | null;
}

export async function createUsuario(usuario: Usuario): Promise<void> {
  await redis.set(`usuario:${usuario.id}`, usuario);
  await redis.set(`usuario:dni:${usuario.dni}`, usuario);
}

export async function getRutinaActivaByCategoria(categoriaId: string): Promise<Rutina | null> {
  const rutinas = (await redis.lrange(`rutinas:categoria:${categoriaId}`, 0, -1)) as Rutina[];
  if (!rutinas || rutinas.length === 0) return null;

  const hoy = new Date().toISOString().split('T')[0];
  return rutinas.find((r) => r.fecha_inicio <= hoy && r.fecha_fin >= hoy) || null;
}

export async function getEjerciciosByRutina(rutinaId: string): Promise<Ejercicio[]> {
  const ejercicios = (await redis.lrange(`ejercicios:rutina:${rutinaId}`, 0, -1)) as Ejercicio[];
  return ejercicios || [];
}

export async function getEjerciciosByRutinaYDia(rutinaId: string, dia: string): Promise<Ejercicio[]> {
  const todos = await getEjerciciosByRutina(rutinaId);
  return todos
    .filter((e) => e.dia.toLowerCase() === dia.toLowerCase())
    .sort((a, b) => a.orden - b.orden);
}

export async function getDiasDeRutina(rutinaId: string): Promise<string[]> {
  const ejercicios = await getEjerciciosByRutina(rutinaId);
  const dias = Array.from(new Set(ejercicios.map((e) => e.dia)));
  const ordenDias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  return dias.sort(
    (a, b) => ordenDias.indexOf(a.toLowerCase()) - ordenDias.indexOf(b.toLowerCase())
  );
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

export async function getAllCategorias(): Promise<Categoria[]> {
  const keys = await redis.keys('categoria:*');
  const categorias = (await Promise.all(keys.map((k) => redis.get(k)))) as (Categoria | null)[];
  return categorias.filter(Boolean) as Categoria[];
}

export async function getAllRutinas(): Promise<Rutina[]> {
  const keys = await redis.keys('rutina:*');
  const rutinas = (await Promise.all(keys.map((k) => redis.get(k)))) as (Rutina | null)[];
  return rutinas.filter(Boolean) as Rutina[];
}

export async function getAsistenciasPorFecha(fecha: string): Promise<Asistencia[]> {
  const keys = await redis.keys('asistencia:*');
  const asistencias = (await Promise.all(keys.map((k) => redis.get(k)))) as (Asistencia | null)[];
  return asistencias.filter((a) => a && a.fecha === fecha) as Asistencia[];
}

export async function getAllUsuarios(): Promise<Usuario[]> {
  const keys = await redis.keys('usuario:user-*');
  const usuarios = (await Promise.all(keys.map((k) => redis.get(k)))) as (Usuario | null)[];
  return usuarios.filter(Boolean) as Usuario[];
}
