import { getTokenPayload } from '@/lib/auth';
import { getUsuarioById, getRutinaActivaByCategoria, getEjerciciosByRutinaYDiaConAyuda, getDiasDeRutina, getRegistrosByJugador, getWellnessSesion, getSemanaActual, getWellnessRules, type ReglaWellness } from '@/lib/redis';
import { sugerirPesoDesdeRegistro } from '@/lib/calculadora-peso';
import RutinaClient from './RutinaClient';

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
  const usuario = await getUsuarioById(payload!.id as string);

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

  const hoy = new Date().toISOString().split('T')[0];
  const wellness = await getWellnessSesion(payload!.id as string, hoy);

  const dias = await getDiasDeRutina(rutina.id);
  const diaActual = searchParams.dia || dias[0] || 'lunes';

  const reglasWellness = await getWellnessRules();
  // Normalizar score: sesiones antiguas usaban 1-5, nuevas usan 0-25
  const wellnessScore025 = wellness
    ? wellness.score <= 5
      ? Math.round(wellness.score * 5)
      : wellness.score
    : null;

  // Solo cargar ejercicios si el jugador completó el cuestionario wellness del día
  let ejercicios: Awaited<ReturnType<typeof getEjerciciosByRutinaYDiaConAyuda>> = [];
  if (wellness && Object.keys(wellness.respuestas).length > 0 && wellnessScore025 != null) {
    ejercicios = await getEjerciciosByRutinaYDiaConAyuda(rutina.id, diaActual, rutina);
    ejercicios = aplicarReglasWellness(ejercicios, reglasWellness, wellnessScore025);
  }

  const wellnessBajo =
    wellnessScore025 != null && reglasWellness.some((r) => cumpleRegla(wellnessScore025, r));

  // Calcular peso sugerido por ejercicio (solo cuando hay ejercicios)
  const registros = await getRegistrosByJugador(payload!.id as string);
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
      dias={dias}
      diaActual={diaActual}
      semanaActual={semanaActual}
      sugerenciasPeso={sugerencias}
      wellnessScore={wellnessScore025}
      wellnessBajo={wellnessBajo ?? false}
    />
  );
}
