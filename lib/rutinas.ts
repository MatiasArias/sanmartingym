import { getFechaHoyArgentina } from '@/lib/fecha';
import { redis } from '@/lib/redis-client';
import {
  getPlantillaEjercicioById,
  type EjercicioPlantilla,
  type ConfigSemana,
} from '@/lib/ejercicios';

export type TipoDia = 'partido' | 'descanso' | 'ejercicio';

export interface Rutina {
  id: string;
  categoria_id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  semanas?: number;
  dias_config?: Partial<Record<string, TipoDia>>;
}

export interface Ejercicio {
  id: string;
  rutina_id: string;
  ejercicio_plantilla_id?: string;
  dia: string;
  nombre: string;
  series: number;
  repeticiones: number;
  rir: number;
  orden: number;
  circuito_nombre?: string;
  config_por_semana?: Record<number, ConfigSemana>;
}

export interface EjercicioConAyuda extends Ejercicio {
  ayuda_alumno?: string;
  nota_semana?: string;
  tipo_plantilla?: EjercicioPlantilla['tipo'];
}

export interface EjercicioEnRutinaInput {
  id?: string;
  ejercicio_plantilla_id: string;
  dia: string;
  orden: number;
  circuito_nombre?: string;
  config_por_semana: Record<number, ConfigSemana>;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getSemanaActual(fechaInicio: string): number {
  const hoyStr = getFechaHoyArgentina();
  const inicio = new Date(fechaInicio + 'T12:00:00');
  const hoy = new Date(hoyStr + 'T12:00:00');
  const diffMs = hoy.getTime() - inicio.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const semana = Math.floor(diffDias / 7) + 1;
  return Math.max(1, semana);
}

export function calcularFechaFin(fechaInicio: string, semanas: number): string {
  const d = new Date(fechaInicio);
  d.setDate(d.getDate() + semanas * 7 - 1);
  return d.toISOString().split('T')[0];
}

export async function getRutinaById(id: string): Promise<Rutina | null> {
  return (await redis.get(`rutina:${id}`)) as Rutina | null;
}

export async function getRutinaActivaByCategoria(categoriaId: string): Promise<Rutina | null> {
  const rutinas = (await redis.lrange(`rutinas:categoria:${categoriaId}`, 0, -1)) as Rutina[];
  if (!rutinas || rutinas.length === 0) return null;
  const hoy = getFechaHoyArgentina();
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
      if (e.config_por_semana[semanaActual].repeticiones != null) {
        ej.repeticiones = e.config_por_semana[semanaActual].repeticiones!;
      }
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
    return ordenDias.filter((d) => rutina.dias_config?.[d] === 'ejercicio');
  }
  const ejercicios = await getEjerciciosByRutina(rutinaId);
  const dias = Array.from(new Set(ejercicios.map((e) => e.dia)));
  const ordenDias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  return dias.sort(
    (a, b) => ordenDias.indexOf(a.toLowerCase()) - ordenDias.indexOf(b.toLowerCase())
  );
}

export async function getAllRutinas(): Promise<Rutina[]> {
  const keys = await redis.keys('rutina:*');
  const rutinas = (await Promise.all(keys.map((k) => redis.get(k)))) as (Rutina | null)[];
  return rutinas.filter(Boolean) as Rutina[];
}

export async function createRutina(
  data: Omit<Rutina, 'id' | 'fecha_fin'> & { fecha_fin?: string }
): Promise<Rutina> {
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
      repeticiones: plantilla.repeticiones_default,
      rir: plantilla.rir_default,
    };
    const ejercicio: Ejercicio = {
      rutina_id: rutinaId,
      id: data.id && existingIds.has(data.id) ? data.id : generateId('ejercicio'),
      ejercicio_plantilla_id: plantilla.id,
      dia: data.dia,
      nombre: plantilla.nombre,
      series: semana1.series,
      repeticiones: semana1.repeticiones ?? plantilla.repeticiones_default,
      rir: semana1.rir,
      orden: data.orden,
      circuito_nombre: data.circuito_nombre,
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
