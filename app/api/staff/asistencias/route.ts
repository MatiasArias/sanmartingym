import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getAllUsuarios, redis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    const categoriaId = searchParams.get('categoria');

    let jugadores = (await getAllUsuarios()).filter(u => u.rol === 'jugador' && u.activo);

    if (categoriaId) {
      jugadores = jugadores.filter(j => j.categoria_id === categoriaId);
    }

    const asistencias = await Promise.all(
      jugadores.map(async (j) => {
        const asistencia = await redis.get(`asistencia:${j.id}:${fecha}`);
        return {
          jugador: j,
          presente: !!asistencia,
        };
      })
    );

    return NextResponse.json({ asistencias, fecha });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener asistencias' },
      { status: 400 }
    );
  }
}
