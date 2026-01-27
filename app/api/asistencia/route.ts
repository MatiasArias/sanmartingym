import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { redis } from '@/lib/redis';

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
