import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getFechaHoyArgentina } from '@/lib/fecha';
import { redis } from '@/lib/redis';
import { z } from 'zod';

const registroSchema = z.object({
  ejercicio_id: z.string(),
  peso: z.number(),
  reps: z.number(),
  serie_num: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'jugador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = registroSchema.parse(body);

    const registro = {
      id: `registro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usuario_id: payload.id as string,
      ejercicio_id: data.ejercicio_id,
      peso: data.peso,
      reps: data.reps,
      serie_num: data.serie_num,
      fecha: getFechaHoyArgentina(),
      timestamp: new Date().toISOString(),
    };

    await redis.lpush(`registros:jugador:${payload.id}`, registro);

    return NextResponse.json({ registro });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar registro' },
      { status: 400 }
    );
  }
}
