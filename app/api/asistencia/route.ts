import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { redis, getUsuarioById, getRutinaActivaByCategoria } from '@/lib/redis';

const DIA_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

function getDiasDelMes(anio: number, mes: number): string[] {
  const ultimo = new Date(anio, mes, 0).getDate();
  const dias: string[] = [];
  for (let d = 1; d <= ultimo; d++) {
    dias.push(`${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return dias;
}

/** Fechas del mes que son "día de partido" según la rutina activa (dias_config) */
function getDiasPartidoEnMes(
  fechaInicio: string,
  fechaFin: string,
  diasConfig: Partial<Record<string, string>> | undefined,
  anio: number,
  mes: number
): string[] {
  if (!diasConfig) return [];
  const dias: string[] = [];
  const diasDelMes = getDiasDelMes(anio, mes);
  for (const fecha of diasDelMes) {
    if (fecha < fechaInicio || fecha > fechaFin) continue;
    const d = new Date(fecha + 'T12:00:00');
    const nombreDia = DIA_SEMANA[d.getDay()];
    if (diasConfig[nombreDia] === 'partido') dias.push(fecha);
  }
  return dias;
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'jugador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') ?? String(new Date().getMonth() + 1), 10);
    const anio = parseInt(searchParams.get('anio') ?? String(new Date().getFullYear()), 10);

    const usuario = await getUsuarioById(payload.id as string);
    if (!usuario?.categoria_id) {
      return NextResponse.json({
        asistencias: [],
        diasPartido: [],
        mes,
        anio,
      });
    }

    const rutina = await getRutinaActivaByCategoria(usuario.categoria_id);
    const diasPartido =
      rutina?.fecha_inicio && rutina?.fecha_fin
        ? getDiasPartidoEnMes(
            rutina.fecha_inicio,
            rutina.fecha_fin,
            rutina.dias_config,
            anio,
            mes
          )
        : [];

    const diasDelMes = getDiasDelMes(anio, mes);
    const asistencias: string[] = [];
    for (const fecha of diasDelMes) {
      const asistencia = await redis.get(`asistencia:${payload.id}:${fecha}`);
      if (asistencia) asistencias.push(fecha);
    }

    return NextResponse.json({
      mes,
      anio,
      asistencias,
      diasPartido,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener asistencias' },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'jugador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const fecha = new Date().toISOString().split('T')[0];
    const asistenciaId = `asistencia:${payload.id}:${fecha}`;

    // Check if already marked
    const existe = await redis.get(asistenciaId);
    if (existe) {
      return NextResponse.json({ message: 'Ya marcaste asistencia hoy' });
    }

    const asistencia = {
      id: asistenciaId,
      usuario_id: payload.id as string,
      fecha,
      timestamp: new Date().toISOString(),
    };

    await redis.set(asistenciaId, asistencia);

    return NextResponse.json({ asistencia });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al marcar asistencia' },
      { status: 400 }
    );
  }
}
