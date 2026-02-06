import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import {
  getUsuarioById,
  getRegistrosByJugador,
  getAsistenciasJugadorEnRango,
  getPlantillaEjercicioById,
  redis,
  type Usuario,
  type RegistroCarga,
  type Ejercicio,
} from '@/lib/redis';

function getRangoDesdeParams(searchParams: URLSearchParams): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = searchParams.get('hasta') ?? hoy.toISOString().split('T')[0];
  const periodo = searchParams.get('periodo') ?? '30'; // 30, 90, 180 días
  const dias = parseInt(periodo, 10) || 30;
  const hastaDate = new Date(hasta);
  const desdeDate = new Date(hastaDate);
  desdeDate.setDate(desdeDate.getDate() - dias);
  const desde = searchParams.get('desde') ?? desdeDate.toISOString().split('T')[0];
  return { desde, hasta };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: jugadorId } = await params;
    const { searchParams } = new URL(request.url);
    const { desde, hasta } = getRangoDesdeParams(searchParams);

    const jugador = await getUsuarioById(jugadorId);
    if (!jugador || jugador.rol !== 'jugador') {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });
    }

    const [registros, fechasAsistencia] = await Promise.all([
      getRegistrosByJugador(jugadorId),
      getAsistenciasJugadorEnRango(jugadorId, desde, hasta),
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

    const totalDiasRango = Math.ceil((new Date(hasta).getTime() - new Date(desde).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const diasPresente = fechasAsistencia.length;
    const porcentajeAsistencia = totalDiasRango > 0 ? Math.round((diasPresente / totalDiasRango) * 100) : 0;

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
              r.peso * r.reps > best.peso * best.reps ? { peso: r.peso, reps: r.reps, fecha: r.fecha } : best,
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
      ejercicios: porEjercicio,
      registros: registrosEnRango,
      metricas,
    });
  } catch (error) {
    console.error('Error rendimiento jugador:', error);
    return NextResponse.json(
      { error: 'Error al obtener rendimiento' },
      { status: 500 }
    );
  }
}
