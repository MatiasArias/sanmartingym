import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { saveWellnessSesion } from '@/lib/redis';
import { z } from 'zod';

const wellnessSchema = z.object({
  sueno: z.number().min(1).max(10),
  energia: z.number().min(1).max(10),
  dolor_muscular: z.number().min(1).max(10).optional(),
  estres: z.number().min(1).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'jugador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = wellnessSchema.parse(body);

    const respuestas: Record<string, number> = {
      sueno: data.sueno,
      energia: data.energia,
    };
    if (data.dolor_muscular != null) respuestas.dolor_muscular = data.dolor_muscular;
    if (data.estres != null) respuestas.estres = data.estres;

    const valores = Object.values(respuestas);
    const score = Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;

    const fecha = new Date().toISOString().split('T')[0];
    await saveWellnessSesion({
      usuario_id: payload.id as string,
      fecha,
      score,
      respuestas,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, score });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar cuestionario wellness' },
      { status: 400 }
    );
  }
}
