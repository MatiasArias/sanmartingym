import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getFechaHoyArgentina } from '@/lib/fecha';
import {
  getUsuarioById,
  getRegistrosByJugador,
  getAsistenciasJugadorEnRango,
  getPlantillaEjercicioById,
  getWellnessSesionesEnRango,
  getRpeSesionesEnRango,
  redis,
  type Usuario,
  type RegistroCarga,
  type Ejercicio,
} from '@/lib/redis';

/** Jugador solo puede ver por semana (7) o por mes (30). Por defecto mes. */
function getRangoDesdeParams(searchParams: URLSearchParams): { desde: string; hasta: string } {
  const hasta = searchParams.get('hasta') ?? getFechaHoyArgentina();
  const periodo = searchParams.get('periodo') ?? 'mes'; // semana | mes
  const dias = periodo === 'semana' ? 7 : 30;
  const [y, m, d] = hasta.split('-').map(Number);
  const hastaDate = new Date(y!, m! - 1, d!);
  hastaDate.setDate(hastaDate.getDate() - dias);
  const desde = searchParams.get('desde') ?? hastaDate.toISOString().split('T')[0];
  return { desde, hasta };
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'jugador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const jugadorId = payload.id as string;
    const { searchParams } = new URL(request.url);
    const { desde, hasta } = getRangoDesdeParams(searchParams);

    const jugador = await getUsuarioById(jugadorId);
    if (!jugador || jugador.rol !== 'jugador') {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });
    }

    const [registros, fechasAsistencia, sesionesWellness, sesionesRpe] = await Promise.all([
      getRegistrosByJugador(jugadorId),
      getAsistenciasJugadorEnRango(jugadorId, desde, hasta),
      getWellnessSesionesEnRango(jugadorId, desde, hasta),
      getRpeSesionesEnRango(jugadorId, desde, hasta),
    ]);

    const registrosEnRango = registros.filter((r) => r.fecha >= desde && r.fecha <= hasta);

    const ejercicioIds = Array.from(new Set(registrosEnRango.map((r) => r.ejercicio_id)));
    const ejerciciosMap: Record<string, Ejercicio> = {};
    await Promise.all(
      ejercicioIds.map(async (ejId) => {
        const ej = (await redis.get(`ejercicio:${ejId}`)) as Ejercicio | null;
        if (ej) ejerciciosMap[ejId] = ej;
      })
    );

    const totalDiasRango =
      Math.ceil((new Date(hasta).getTime() - new Date(desde).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const diasPresente = fechasAsistencia.length;
    const porcentajeAsistencia =
      totalDiasRango > 0 ? Math.round((diasPresente / totalDiasRango) * 100) : 0;

    const porEjercicio: Record<
      string,
      {
        nombre: string;
        tipo: 'empuje' | 'traccion' | 'movilidad';
        registros: RegistroCarga[];
        pesoMax: number;
        mejorSerie: { peso: number; reps: number; fecha: string };
        porFecha: { fecha: string; pesoMax: number }[];
      }
    > = {};
    for (const ejId of ejercicioIds) {
      const ej = ejerciciosMap[ejId];
      const nombre = ej?.nombre ?? ejId;
      const plantilla = ej?.ejercicio_plantilla_id
        ? await getPlantillaEjercicioById(ej.ejercicio_plantilla_id)
        : null;
      const tipo = plantilla?.tipo ?? 'empuje';
      const regs = registrosEnRango.filter((r) => r.ejercicio_id === ejId);
      const pesoMax = regs.length ? Math.max(...regs.map((r) => r.peso)) : 0;
      const mejorSerie = regs.length
        ? regs.reduce(
            (best, r) =>
              r.peso * r.reps > best.peso * best.reps
                ? { peso: r.peso, reps: r.reps, fecha: r.fecha }
                : best,
            { peso: regs[0].peso, reps: regs[0].reps, fecha: regs[0].fecha }
          )
        : { peso: 0, reps: 0, fecha: '' };
      const porFechaMap = new Map<string, number>();
      for (const r of regs) {
        const actual = porFechaMap.get(r.fecha) ?? 0;
        if (r.peso > actual) porFechaMap.set(r.fecha, r.peso);
      }
      const porFecha = Array.from(porFechaMap.entries())
        .map(([fecha, maxPeso]) => ({ fecha, pesoMax: maxPeso }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
      porEjercicio[ejId] = { nombre, tipo, registros: regs, pesoMax, mejorSerie, porFecha };
    }

    const pesoCorporal = (jugador as Usuario & { peso_kg?: number }).peso_kg;
    const metricas = {
      pesoCorporalKg: pesoCorporal ?? null,
      rmRelativaPorEjercicio: pesoCorporal
        ? Object.fromEntries(
            Object.entries(porEjercicio).map(([id, d]) => [
              id,
              d.pesoMax > 0 ? Math.round((d.pesoMax / pesoCorporal) * 100) / 100 : null,
            ])
          )
        : null,
    };

    const wellnessPromedio =
      sesionesWellness.length > 0
        ? Math.round(
            (sesionesWellness.reduce((s, w) => s + (w.score <= 5 ? w.score * 5 : w.score), 0) /
              sesionesWellness.length) *
              10
          ) / 10
        : null;
    const rpePromedio =
      sesionesRpe.length > 0
        ? Math.round((sesionesRpe.reduce((s, r) => s + r.rpe, 0) / sesionesRpe.length) * 10) / 10
        : null;

    return NextResponse.json({
      jugador: {
        id: jugador.id,
        nombre: jugador.nombre,
        dni: jugador.dni,
        categoria_id: jugador.categoria_id,
        peso_kg: pesoCorporal ?? null,
      },
      periodo: { desde, hasta },
      asistencia: {
        diasPresente,
        totalDias: totalDiasRango,
        porcentaje: porcentajeAsistencia,
        fechas: fechasAsistencia,
      },
      wellness: {
        sesiones: sesionesWellness.map((w) => ({
          fecha: w.fecha,
          score: w.score <= 5 ? Math.round(w.score * 5) : w.score,
          respuestas: w.respuestas,
        })),
        promedioScore: wellnessPromedio,
        diasCompletados: sesionesWellness.length,
      },
      rpe: {
        sesiones: sesionesRpe,
        promedioRpe: rpePromedio,
        diasConRpe: sesionesRpe.length,
      },
      ejercicios: porEjercicio,
      registros: registrosEnRango,
      metricas,
    });
  } catch (error) {
    console.error('Error rendimiento jugador (self):', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
