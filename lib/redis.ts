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
  async del(key: string): Promise<number> {
    return client.del(key);
  },
  async zadd(key: string, score: number, member: string): Promise<number> {
    return client.zadd(key, score, member);
  },
  async zcount(key: string, min: number | string, max: number | string): Promise<number> {
    return client.zcount(key, min, max);
  },
  async zrem(key: string, ...members: string[]): Promise<number> {
    return client.zrem(key, ...members);
  },
};

// TypeScript types
export interface Usuario {
  id: string;
  dni: string;
  nombre: string;
  rol: 'jugador' | 'staff';
  categoria_id?: string;
  fecha_nacimiento?: string; // YYYY-MM-DD
  activo: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
}

export type TipoDia = 'partido' | 'descanso' | 'ejercicio';

export interface Rutina {
  id: string;
  categoria_id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  semanas?: number; // si no existe, se infiere de fecha_inicio y fecha_fin
  /** Config por día (lunes a sábado). Si no existe, asume descanso. */
  dias_config?: Partial<Record<string, TipoDia>>;
}

/** Catálogo de ejercicios (plantillas) - gestionado por staff */
export interface EjercicioPlantilla {
  id: string;
  nombre: string;
  series_default: number;
  rir_default: number;
  repeticiones_default: number;
  /** Tipo de patrón principal del ejercicio. Se agrega 'movilidad' para activaciones sin carga. */
  tipo: 'empuje' | 'traccion' | 'movilidad';
  musculo_principal: string;
  modo_serie: 'serie_x_repeticion' | 'serie_x_minutos' | 'serie_x_brazo';
  ayuda_alumno: string;
}

/** Config de series y RIR por semana */
export interface ConfigSemana {
  series: number;
  rir: number;
  nota?: string;
}

/** Ejercicio en una rutina - referencia plantilla + config por semana */
export interface Ejercicio {
  id: string;
  rutina_id: string;
  ejercicio_plantilla_id?: string;
  dia: string;
  nombre: string;
  series: number; // para compat / semana actual
  repeticiones: number;
  rir: number;
  orden: number;
  /** Config por semana: { 1: {series, rir}, 2: {...}, ... } */
  config_por_semana?: Record<number, ConfigSemana>;
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

/** RPE (escala 1-10) al final de una sesión de rutina */
export interface RpeSesion {
  usuario_id: string;
  fecha: string;
  rutina_id: string;
  dia: string;
  rpe: number; // 1-10
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

export async function getJugadores(): Promise<Usuario[]> {
  const usuarios = await getAllUsuarios();
  return usuarios.filter((u) => u.rol === 'jugador');
}

export async function createJugador(data: {
  dni: string;
  nombre: string;
  categoria_id: string;
  fecha_nacimiento: string;
}): Promise<Usuario> {
  const existing = await getUsuarioByDni(data.dni);
  if (existing) throw new Error('Ya existe un usuario con ese DNI');

  const usuario: Usuario = {
    id: `user-jugador-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    dni: data.dni,
    nombre: data.nombre,
    rol: 'jugador',
    categoria_id: data.categoria_id,
    fecha_nacimiento: data.fecha_nacimiento,
    activo: true,
  };
  await createUsuario(usuario);
  return usuario;
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

/** Ejercicio enriquecido con ayuda_alumno, nota de la semana actual y tipo de plantilla */
export interface EjercicioConAyuda extends Ejercicio {
  ayuda_alumno?: string;
  nota_semana?: string;
  /** Copiamos el tipo de la plantilla (empuje/traccion/movilidad) para la UI del jugador. */
  tipo_plantilla?: EjercicioPlantilla['tipo'];
}

/** Obtiene el número de semana actual (1-based) desde fecha_inicio */
export function getSemanaActual(fechaInicio: string): number {
  const inicio = new Date(fechaInicio);
  const hoy = new Date();
  const diffMs = hoy.getTime() - inicio.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const semana = Math.floor(diffDias / 7) + 1;
  return Math.max(1, semana);
}

export async function getEjerciciosByRutinaYDiaConAyuda(
  rutinaId: string,
  dia: string,
  rutina?: Rutina | null
): Promise<EjercicioConAyuda[]> {
  const ejercicios = await getEjerciciosByRutinaYDia(rutinaId, dia);
  const r = rutina ?? (await getRutinaById(rutinaId));
  const semanaActual = r ? getSemanaActual(r.fecha_inicio) : 1;

  const enriquecidos: EjercicioConAyuda[] = [];
  for (const e of ejercicios) {
    const ej: EjercicioConAyuda = { ...e };
    if (e.config_por_semana?.[semanaActual]) {
      ej.series = e.config_por_semana[semanaActual].series;
      ej.rir = e.config_por_semana[semanaActual].rir;
      if (e.config_por_semana[semanaActual].nota) {
        ej.nota_semana = e.config_por_semana[semanaActual].nota;
      }
    }
    if (e.ejercicio_plantilla_id) {
      const plantilla = await getPlantillaEjercicioById(e.ejercicio_plantilla_id);
      if (plantilla) {
        if (plantilla.ayuda_alumno) ej.ayuda_alumno = plantilla.ayuda_alumno;
        ej.tipo_plantilla = plantilla.tipo;
      }
    }
    enriquecidos.push(ej);
  }
  return enriquecidos;
}

export async function getDiasDeRutina(rutinaId: string): Promise<string[]> {
  const rutina = await getRutinaById(rutinaId);
  if (rutina?.dias_config) {
    const ordenDias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return ordenDias.filter(
      (d) => rutina.dias_config?.[d] === 'ejercicio'
    );
  }
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

/** Guarda RPE de sesión (jugador + fecha). Key: rpe_sesion:{usuario_id}:{fecha} */
export async function saveRpeSesion(data: RpeSesion): Promise<void> {
  const key = `rpe_sesion:${data.usuario_id}:${data.fecha}`;
  await redis.set(key, data);
}

/** Obtiene RPE de sesión para un jugador en una fecha */
export async function getRpeSesion(usuarioId: string, fecha: string): Promise<RpeSesion | null> {
  const key = `rpe_sesion:${usuarioId}:${fecha}`;
  return (await redis.get(key)) as RpeSesion | null;
}

/** Cuestionario Wellness del día (antes de rutina). Puntajes 1-5 por pregunta. */
export interface WellnessSesion {
  usuario_id: string;
  fecha: string;
  score: number; // promedio de respuestas 1-5
  respuestas: Record<string, number>; // sueno, energia, dolor_muscular, estres (1-5)
  timestamp: string;
}

/** Regla de adaptación por wellness: si métrica cumple condición, aplicar acción. */
export interface ReglaWellness {
  metric: 'bienestar' | 'cansancio';
  operator: '<' | '<=';
  threshold: number; // 1-5
  action: 'quitar_reps' | 'quitar_series';
  amount: number;
}

const WELLNESS_RULES_KEY = 'config:wellness-rules';

export async function getWellnessRules(): Promise<ReglaWellness[]> {
  const data = await redis.get(WELLNESS_RULES_KEY);
  if (data && Array.isArray(data) && data.length > 0) return data as ReglaWellness[];
  return [
    { metric: 'bienestar', operator: '<', threshold: 2, action: 'quitar_reps', amount: 1 },
    { metric: 'cansancio', operator: '<', threshold: 2, action: 'quitar_series', amount: 1 },
  ];
}

export async function setWellnessRules(rules: ReglaWellness[]): Promise<void> {
  await redis.set(WELLNESS_RULES_KEY, rules);
}

const WELLNESS_KEY_PREFIX = 'wellness:';

export async function saveWellnessSesion(data: WellnessSesion): Promise<void> {
  const key = `${WELLNESS_KEY_PREFIX}${data.usuario_id}:${data.fecha}`;
  await redis.set(key, data);
}

export async function getWellnessSesion(usuarioId: string, fecha: string): Promise<WellnessSesion | null> {
  const key = `${WELLNESS_KEY_PREFIX}${usuarioId}:${fecha}`;
  return (await redis.get(key)) as WellnessSesion | null;
}

export async function getAllUsuarios(): Promise<Usuario[]> {
  const keys = await redis.keys('usuario:user-*');
  const usuarios = (await Promise.all(keys.map((k) => redis.get(k)))) as (Usuario | null)[];
  return usuarios.filter(Boolean) as Usuario[];
}

// --- Catálogo de Ejercicios (Plantillas) ---

export async function getAllPlantillasEjercicio(): Promise<EjercicioPlantilla[]> {
  const keys = await redis.keys('plantilla-ejercicio:*');
  const plantillas = (await Promise.all(keys.map((k) => redis.get(k)))) as (EjercicioPlantilla | null)[];
  return plantillas.filter(Boolean) as EjercicioPlantilla[];
}

export async function getPlantillaEjercicioById(id: string): Promise<EjercicioPlantilla | null> {
  return (await redis.get(`plantilla-ejercicio:${id}`)) as EjercicioPlantilla | null;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function createPlantillaEjercicio(
  data: Omit<EjercicioPlantilla, 'id'>
): Promise<EjercicioPlantilla> {
  const plantilla: EjercicioPlantilla = {
    ...data,
    id: generateId('plantilla-ej'),
  };
  await redis.set(`plantilla-ejercicio:${plantilla.id}`, plantilla);
  return plantilla;
}

export async function updatePlantillaEjercicio(plantilla: EjercicioPlantilla): Promise<void> {
  await redis.set(`plantilla-ejercicio:${plantilla.id}`, plantilla);
}

export async function deletePlantillaEjercicio(id: string): Promise<void> {
  await redis.del(`plantilla-ejercicio:${id}`);
}

// --- Rutinas y Ejercicios (CRUD) ---

export async function getRutinaById(id: string): Promise<Rutina | null> {
  return (await redis.get(`rutina:${id}`)) as Rutina | null;
}

export async function createRutina(data: Omit<Rutina, 'id' | 'fecha_fin'> & { fecha_fin?: string }): Promise<Rutina> {
  const semanas = data.semanas ?? 4;
  const fecha_fin = data.fecha_fin ?? calcularFechaFin(data.fecha_inicio, semanas);
  const rutina: Rutina = {
    ...data,
    id: generateId('rutina'),
    semanas,
    fecha_fin,
    dias_config: data.dias_config ?? {},
  };
  await redis.set(`rutina:${rutina.id}`, rutina);
  await redis.lpush(`rutinas:categoria:${rutina.categoria_id}`, rutina);
  return rutina;
}

export async function updateRutina(rutina: Rutina): Promise<void> {
  const existing = await getRutinaById(rutina.id);
  if (!existing) throw new Error('Rutina no encontrada');

  const fecha_fin = rutina.fecha_fin || calcularFechaFin(rutina.fecha_inicio, rutina.semanas ?? 4);
  const rutinaActualizada = { ...rutina, fecha_fin };

  await redis.set(`rutina:${rutina.id}`, rutinaActualizada);

  if (existing.categoria_id !== rutina.categoria_id) {
    const oldKey = `rutinas:categoria:${existing.categoria_id}`;
    const oldList = (await redis.lrange(oldKey, 0, -1)) as Rutina[];
    const filtered = oldList.filter((r) => r.id !== rutina.id);
    await redis.del(oldKey);
    for (const r of filtered.reverse()) {
      await redis.lpush(oldKey, r);
    }
    await redis.lpush(`rutinas:categoria:${rutina.categoria_id}`, rutinaActualizada);
  } else {
    const key = `rutinas:categoria:${rutina.categoria_id}`;
    const list = (await redis.lrange(key, 0, -1)) as Rutina[];
    const updated = list.map((r) => (r.id === rutina.id ? rutinaActualizada : r));
    await redis.del(key);
    for (const r of updated.reverse()) {
      await redis.lpush(key, r);
    }
  }
}

/** Calcula fecha_fin a partir de fecha_inicio + semanas */
export function calcularFechaFin(fechaInicio: string, semanas: number): string {
  const d = new Date(fechaInicio);
  d.setDate(d.getDate() + semanas * 7 - 1);
  return d.toISOString().split('T')[0];
}

/** Datos para agregar ejercicio a rutina (con config por semana) */
export interface EjercicioEnRutinaInput {
  id?: string;
  ejercicio_plantilla_id: string;
  dia: string;
  orden: number;
  config_por_semana: Record<number, ConfigSemana>;
}

export async function saveEjerciciosForRutina(
  rutinaId: string,
  ejerciciosData: EjercicioEnRutinaInput[],
  semanas: number
): Promise<Ejercicio[]> {
  const existing = await getEjerciciosByRutina(rutinaId);
  const existingIds = new Set(existing.map((e) => e.id));
  const requestedIds = new Set(ejerciciosData.map((e) => e.id).filter(Boolean) as string[]);

  const toDelete = existing.filter((e) => !requestedIds.has(e.id));
  for (const ej of toDelete) {
    await redis.del(`ejercicio:${ej.id}`);
  }

  const saved: Ejercicio[] = [];
  for (const data of ejerciciosData) {
    const plantilla = await getPlantillaEjercicioById(data.ejercicio_plantilla_id);
    if (!plantilla) throw new Error(`Plantilla ${data.ejercicio_plantilla_id} no encontrada`);

    const semana1 = data.config_por_semana[1] ?? {
      series: plantilla.series_default,
      rir: plantilla.rir_default,
    };
    const ejercicio: Ejercicio = {
      rutina_id: rutinaId,
      id: data.id && existingIds.has(data.id) ? data.id : generateId('ejercicio'),
      ejercicio_plantilla_id: plantilla.id,
      dia: data.dia,
      nombre: plantilla.nombre,
      series: semana1.series,
      repeticiones: plantilla.repeticiones_default,
      rir: semana1.rir,
      orden: data.orden,
      config_por_semana: data.config_por_semana,
    };
    await redis.set(`ejercicio:${ejercicio.id}`, ejercicio);
    saved.push(ejercicio);
  }

  const key = `ejercicios:rutina:${rutinaId}`;
  await redis.del(key);
  for (const ej of saved.reverse()) {
    await redis.lpush(key, ej);
  }

  return saved;
}

// --- Comentarios de ejercicios (jugadores envían, staff los ve) ---
export interface ComentarioEjercicio {
  id: string;
  ejercicio_id: string;
  texto: string;
  timestamp: string;
  anonimo: boolean;
  /** Nombre del jugador cuando anonimo=false */
  usuario_nombre?: string;
  /** Si fue resuelto por el staff */
  resuelto?: boolean;
  resuelto_at?: string;
}

const COMENTARIOS_KEY_PREFIX = 'comentarios:ejercicio:';

const COMENTARIOS_INDICE_KEY = 'comentarios:indice';

export async function addComentarioEjercicio(data: Omit<ComentarioEjercicio, 'id'> & { anonimo: boolean; usuario_nombre?: string }): Promise<ComentarioEjercicio> {
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

export async function getComentariosByEjercicio(ejercicioId: string, soloNoResueltos = false): Promise<ComentarioEjercicio[]> {
  const key = `${COMENTARIOS_KEY_PREFIX}${ejercicioId}`;
  const comentarios = (await redis.lrange(key, 0, -1)) as ComentarioEjercicio[];
  let list = comentarios || [];
  if (soloNoResueltos) list = list.filter((c) => !c.resuelto);
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getComentariosByEjercicios(ejercicioIds: string[]): Promise<Record<string, ComentarioEjercicio[]>> {
  const result: Record<string, ComentarioEjercicio[]> = {};
  await Promise.all(
    ejercicioIds.map(async (id) => {
      result[id] = await getComentariosByEjercicio(id);
    })
  );
  return result;
}

export async function getComentariosNoResueltosByEjercicios(ejercicioIds: string[]): Promise<Record<string, ComentarioEjercicio[]>> {
  const result: Record<string, ComentarioEjercicio[]> = {};
  await Promise.all(
    ejercicioIds.map(async (id) => {
      result[id] = await getComentariosByEjercicio(id, true);
    })
  );
  return result;
}

const COMENTARIOS_RESUELTOS_KEY = 'comentarios:resueltos';

export interface ComentarioResuelto extends ComentarioEjercicio {
  ejercicio_nombre: string;
  resuelto_at: string;
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
    (a, b) => new Date(b.resuelto_at || b.timestamp).getTime() - new Date(a.resuelto_at || a.timestamp).getTime()
  );
}

const STAFF_ULTIMA_VISTA_PREFIX = 'staff:ultima_vista_comentarios:';

export async function getComentariosNuevosCount(staffUserId: string): Promise<number> {
  const lastViewed = (await redis.get(`${STAFF_ULTIMA_VISTA_PREFIX}${staffUserId}`)) as number | string | null;
  if (!lastViewed) return 0;
  const minScore = typeof lastViewed === 'number' ? lastViewed : parseInt(String(lastViewed), 10) || 0;
  return redis.zcount(COMENTARIOS_INDICE_KEY, minScore + 1, '+inf');
}

export async function marcarComentariosVistos(staffUserId: string): Promise<void> {
  await redis.set(`${STAFF_ULTIMA_VISTA_PREFIX}${staffUserId}`, Date.now());
}
