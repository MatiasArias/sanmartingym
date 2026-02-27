import { getTokenPayload } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { config } from '@/lib/config';
import { getFechaHoyArgentina, getDiaSemanaHoyArgentina } from '@/lib/fecha';
import { getUsuarioById, getRutinaActivaByCategoria, getEjerciciosByRutinaYDiaConAyuda, getRegistrosByJugador, getWellnessSesion, getSemanaActual, getWellnessRules, type ReglaWellness } from '@/lib/redis';
import type { TipoDia } from '@/lib/rutinas';
import { sugerirPesoDesdeRegistro } from '@/lib/calculadora-peso';
import RutinaClient from './RutinaClient';

/** Días de la semana (lunes a sábado) para el selector. */
const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

/** Devuelve el día actual en español (lunes..sábado) en zona Argentina. Domingo -> sábado para tener un valor por defecto. */
function getDiaActual(): (typeof DIAS_SEMANA)[number] {
  const d = getDiaSemanaHoyArgentina(); // 0=domingo, 1=lunes, ..., 6=sábado
  const index = d === 0 ? 5 : d - 1; // domingo -> sábado (índice 5)
  return DIAS_SEMANA[index];
}

function cumpleRegla(score: number, rule: ReglaWellness): boolean {
  if (rule.metric !== 'score') return false;
  if (rule.operator === '<') return score < rule.threshold;
  return score <= rule.threshold;
}

function aplicarReglasWellness(
  ejercicios: Awaited<ReturnType<typeof getEjerciciosByRutinaYDiaConAyuda>>,
  reglas: ReglaWellness[],
  score: number
) {
  let quitarReps = 0;
  let quitarSeries = 0;
  for (const r of reglas) {
    if (cumpleRegla(score, r)) {
      if (r.action === 'quitar_reps') quitarReps += r.amount;
      else quitarSeries += r.amount;
    }
  }
  return ejercicios.map((ej) => ({
    ...ej,
    series: Math.max(1, ej.series - quitarSeries),
    repeticiones: Math.max(1, ej.repeticiones - quitarReps),
  }));
}

export default async function RutinaPage({ searchParams }: { searchParams: { dia?: string } }) {
  const payload = await getTokenPayload();
  if (!payload?.id) redirect('/login');
  const usuario = await getUsuarioById(payload.id as string);

  if (!usuario?.categoria_id) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No tenés una categoría asignada</p>
        </div>
      </div>
    );
  }

  const rutina = await getRutinaActivaByCategoria(usuario.categoria_id);

  if (!rutina) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No hay rutina activa para tu categoría</p>
        </div>
      </div>
    );
  }

  const hoy = getFechaHoyArgentina();
  const wellness = await getWellnessSesion(payload.id as string, hoy);

  const diaHoy = getDiaActual();
  const diaActualParam = searchParams.dia?.toLowerCase();
  const diaActual =
    diaActualParam && DIAS_SEMANA.includes(diaActualParam as (typeof DIAS_SEMANA)[number])
      ? diaActualParam
      : diaHoy;
  const tipoDiaActual: TipoDia = rutina.dias_config?.[diaActual] ?? 'ejercicio';

  const reglasWellness = await getWellnessRules();
  // Normalizar score: sesiones antiguas usaban 1-5, nuevas usan 0-25
  const wellnessScore025 = wellness
    ? wellness.score <= 5
      ? Math.round(wellness.score * 5)
      : wellness.score
    : null;

  // Cargar ejercicios siempre (wellness solo adapta series/reps; si no completó, ver rutina completa)
  let ejercicios = await getEjerciciosByRutinaYDiaConAyuda(rutina.id, diaActual, rutina);
  if (wellness && Object.keys(wellness.respuestas).length > 0 && wellnessScore025 != null) {
    ejercicios = aplicarReglasWellness(ejercicios, reglasWellness, wellnessScore025);
  }

  const wellnessBajo =
    wellnessScore025 != null && reglasWellness.some((r) => cumpleRegla(wellnessScore025, r));

  // Calcular peso sugerido por ejercicio (solo cuando hay ejercicios)
  const registros = await getRegistrosByJugador(payload.id as string);
  const sugerencias: Record<string, number> = {};
  for (const ej of ejercicios) {
    const registrosEj = registros
      .filter((r) => r.ejercicio_id === ej.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const ultimo = registrosEj[0];
    if (ultimo) {
      const sugerido = sugerirPesoDesdeRegistro(ultimo.peso, ultimo.reps, ej.repeticiones);
      if (sugerido != null) sugerencias[ej.id] = sugerido;
    }
  }

  const semanaActual = getSemanaActual(rutina.fecha_inicio);

  return (
    <RutinaClient
      rutina={rutina}
      ejercicios={ejercicios}
      dias={[...DIAS_SEMANA]}
      diaActual={diaActual}
      diaHoy={diaHoy}
      tipoDiaActual={tipoDiaActual}
      semanaActual={semanaActual}
      sugerenciasPeso={sugerencias}
      wellnessScore={wellnessScore025}
      wellnessBajo={wellnessBajo ?? false}
      wellnessObligatorio={config.wellnessObligatorio ?? false}
    />
  );
}
