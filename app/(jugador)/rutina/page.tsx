import { getTokenPayload } from '@/lib/auth';
import { getUsuarioById, getRutinaActivaByCategoria, getEjerciciosByRutinaYDiaConAyuda, getDiasDeRutina, getRegistrosByJugador, getWellnessSesion, getSemanaActual, getWellnessRules, type ReglaWellness } from '@/lib/redis';
import { sugerirPesoDesdeRegistro } from '@/lib/calculadora-peso';
import RutinaClient from './RutinaClient';

/** Deriva bienestar (1-5) y cansancio (1-5) desde respuestas del cuestionario. */
function derivarMetricasWellness(respuestas: Record<string, number>): { bienestar: number; cansancio: number } {
  const sueno = respuestas.sueno ?? 3;
  const energia = respuestas.energia ?? 3;
  const estres = respuestas.estres ?? 3;
  return {
    bienestar: Math.round(((sueno + energia) / 2) * 10) / 10,
    cansancio: estres, // 1=muy cansado, 5=nada
  };
}

function cumpleRegla(metric: 'bienestar' | 'cansancio', value: number, rule: ReglaWellness): boolean {
  if (rule.metric !== metric) return false;
  if (rule.operator === '<') return value < rule.threshold;
  return value <= rule.threshold;
}

function aplicarReglasWellness(
  ejercicios: Awaited<ReturnType<typeof getEjerciciosByRutinaYDiaConAyuda>>,
  reglas: ReglaWellness[],
  bienestar: number,
  cansancio: number
) {
  let quitarReps = 0;
  let quitarSeries = 0;
  for (const r of reglas) {
    if (r.metric === 'bienestar' && cumpleRegla('bienestar', bienestar, r)) {
      if (r.action === 'quitar_reps') quitarReps += r.amount;
      else quitarSeries += r.amount;
    }
    if (r.metric === 'cansancio' && cumpleRegla('cansancio', cansancio, r)) {
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
  let ejercicios = await getEjerciciosByRutinaYDiaConAyuda(rutina.id, diaActual, rutina);

  const reglasWellness = await getWellnessRules();
  if (wellness && Object.keys(wellness.respuestas).length > 0) {
    const { bienestar, cansancio } = derivarMetricasWellness(wellness.respuestas);
    ejercicios = aplicarReglasWellness(ejercicios, reglasWellness, bienestar, cansancio);
  }

  const wellnessBajo =
    wellness &&
    (() => {
      const { bienestar, cansancio } = derivarMetricasWellness(wellness.respuestas);
      return reglasWellness.some(
        (r) =>
          (r.metric === 'bienestar' && cumpleRegla('bienestar', bienestar, r)) ||
          (r.metric === 'cansancio' && cumpleRegla('cansancio', cansancio, r))
      );
    })();

  // Calcular peso sugerido por ejercicio según historial del jugador
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
      wellnessScore={wellness?.score ?? null}
      wellnessBajo={wellnessBajo ?? false}
    />
  );
}
