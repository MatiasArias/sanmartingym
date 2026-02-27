/**
 * Datos para el home del jugador: sesiones esta semana, estado semanal, último ejercicio.
 * Rangos de fechas en zona horaria Argentina.
 */

import {
  getCurrentWeekRangeArgentina,
  getLast30DaysRangeArgentina,
  iterarDiasEntre,
} from '@/lib/fecha';
import type { RegistroCarga } from '@/lib/registros';
import type { Rutina } from '@/lib/rutinas';

const DIAS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
const DIAS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

function getDayName(date: Date): (typeof DIAS_ORDER)[number] {
  return DIAS_ES[date.getDay()] as (typeof DIAS_ORDER)[number];
}

export function getCurrentWeekRange(): { desde: string; hasta: string } {
  return getCurrentWeekRangeArgentina();
}

export function getLast30DaysRange(): { desde: string; hasta: string } {
  return getLast30DaysRangeArgentina();
}

/** Cantidad de días distintos con al menos un registro en la semana actual */
export function sesionesCompletadasEstaSemana(
  registros: RegistroCarga[],
  semanaDesde: string,
  semanaHasta: string
): number {
  const fechas = new Set(
    registros
      .filter((r) => r.fecha >= semanaDesde && r.fecha <= semanaHasta)
      .map((r) => r.fecha)
  );
  return fechas.size;
}

/**
 * Entrenamientos realizados vs total en la semana actual.
 * Total = días de la semana que son "ejercicio" en la rutina.
 * Realizados = de esos días, cuántos tienen al menos un registro.
 */
export function entrenamientosSemana(
  registros: RegistroCarga[],
  diasEjercicio: string[],
  semanaDesde: string,
  semanaHasta: string
): { realizados: number; total: number } {
  let total = 0;
  let realizados = 0;
  const fechasConRegistro = new Set(
    registros
      .filter((r) => r.fecha >= semanaDesde && r.fecha <= semanaHasta)
      .map((r) => r.fecha)
  );
  for (const fechaStr of iterarDiasEntre(semanaDesde, semanaHasta)) {
    const [y, m, d] = fechaStr.split('-').map(Number);
    const current = new Date(y!, m! - 1, d!);
    const diaNombre = getDayName(current);
    if (diasEjercicio.map((d) => d.toLowerCase()).includes(diaNombre.toLowerCase())) {
      total++;
      if (fechasConRegistro.has(fechaStr)) realizados++;
    }
  }
  return { realizados, total };
}

/** Porcentaje de asistencia (días presentes / total días en rango) */
export function porcentajeAsistencia(
  fechasPresentes: string[],
  desde: string,
  hasta: string
): number {
  const totalDias =
    Math.ceil((new Date(hasta).getTime() - new Date(desde).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const set = new Set(fechasPresentes);
  return totalDias > 0 ? Math.round((set.size / totalDias) * 100) : 0;
}

export interface UltimoEjercicioData {
  ejercicioId: string;
  nombre: string;
  peso: number;
  reps: number;
  fecha: string;
  progresoTexto: string;
  porFecha: { fecha: string; pesoMax: number }[];
}

/**
 * Datos del último ejercicio registrado: peso, comparación con semana anterior, mini serie por fecha.
 * El nombre del ejercicio se resuelve en la página (redis).
 */
export function ultimoEjercicioData(registros: RegistroCarga[]): Omit<UltimoEjercicioData, 'nombre'> | null {
  if (registros.length === 0) return null;
  const sorted = [...registros].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const ultimo = sorted[0];
  const ejercicioId = ultimo.ejercicio_id;

  const registrosEj = registros.filter((r) => r.ejercicio_id === ejercicioId);
  const porFechaMap = new Map<string, number>();
  for (const r of registrosEj) {
    const actual = porFechaMap.get(r.fecha) ?? 0;
    if (r.peso > actual) porFechaMap.set(r.fecha, r.peso);
  }
  const porFecha = Array.from(porFechaMap.entries())
    .map(([fecha, pesoMax]) => ({ fecha, pesoMax }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(-6);

  const { desde: semanaDesde, hasta: semanaHasta } = getCurrentWeekRange();
  const [yD, mD, dD] = semanaDesde.split('-').map(Number);
  const [yH, mH, dH] = semanaHasta.split('-').map(Number);
  const ultimaSemanaDesde = new Date(yD!, mD! - 1, dD!);
  ultimaSemanaDesde.setDate(ultimaSemanaDesde.getDate() - 7);
  const ultimaSemanaHasta = new Date(yH!, mH! - 1, dH!);
  ultimaSemanaHasta.setDate(ultimaSemanaHasta.getDate() - 7);
  const prevWeekFrom = ultimaSemanaDesde.toISOString().split('T')[0]!;
  const prevWeekTo = ultimaSemanaHasta.toISOString().split('T')[0]!;

  const maxEstaSemana =
    registrosEj
      .filter((r) => r.fecha >= semanaDesde && r.fecha <= semanaHasta)
      .reduce((max, r) => (r.peso > max ? r.peso : max), 0) || ultimo.peso;
  const maxSemanaPasada = registrosEj
    .filter((r) => r.fecha >= prevWeekFrom && r.fecha <= prevWeekTo)
    .reduce((max, r) => (r.peso > max ? r.peso : max), 0);

  let progresoTexto = 'Sin datos previos';
  if (maxSemanaPasada > 0) {
    const diff = maxEstaSemana - maxSemanaPasada;
    if (diff > 0) progresoTexto = `+${diff} kg la semana pasada`;
    else if (diff < 0) progresoTexto = `${diff} kg la semana pasada`;
    else progresoTexto = 'Sin cambio';
  }

  return {
    ejercicioId,
    peso: ultimo.peso,
    reps: ultimo.reps,
    fecha: ultimo.fecha,
    progresoTexto,
    porFecha,
  };
}
