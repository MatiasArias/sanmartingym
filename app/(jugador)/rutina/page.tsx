import { getTokenPayload } from '@/lib/auth';
import { getUsuarioById, getRutinaActivaByCategoria, getEjerciciosByRutinaYDiaConAyuda, getDiasDeRutina, getRegistrosByJugador, getWellnessSesion, getSemanaActual } from '@/lib/redis';
import { sugerirPesoDesdeRegistro } from '@/lib/calculadora-peso';
import RutinaClient from './RutinaClient';

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

  // Si completó wellness y está cansado, reducir una serie y una rep por ejercicio
  const WELLNESS_UMBRAL = 6;
  if (wellness && wellness.score < WELLNESS_UMBRAL) {
    ejercicios = ejercicios.map((ej) => ({
      ...ej,
      series: Math.max(1, ej.series - 1),
      repeticiones: Math.max(1, ej.repeticiones - 1),
    }));
  }

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
      wellnessBajo={wellness ? wellness.score < WELLNESS_UMBRAL : false}
    />
  );
}
