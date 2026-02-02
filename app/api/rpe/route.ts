import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { saveRpeSesion } from '@/lib/redis';
import { z } from 'zod';

const rpeSchema = z.object({
  rpe: z.number().min(1).max(10),
  rutina_id: z.string(),
  dia: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'jugador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = rpeSchema.parse(body);

    const fecha = new Date().toISOString().split('T')[0];
    await saveRpeSesion({
      usuario_id: payload.id as string,
      fecha,
      rutina_id: data.rutina_id,
      dia: data.dia,
      rpe: data.rpe,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar RPE' },
      { status: 400 }
    );
  }
}
