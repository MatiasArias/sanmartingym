import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { saveWellnessSesion } from '@/lib/redis';
import { z } from 'zod';

const wellnessSchema = z.object({
  sueno: z.number().min(1).max(5),
  energia: z.number().min(1).max(5),
  dolor_muscular: z.number().min(1).max(5),
  estres: z.number().min(1).max(5),
  motivacion: z.number().min(1).max(5),
});

/** Suma de 5 respuestas 1-5 = 5-25; escalado a 0-25 */
function calcularScore025(respuestas: Record<string, number>): number {
  const ids = ['sueno', 'energia', 'dolor_muscular', 'estres', 'motivacion'];
  const sum = ids.reduce((acc, id) => acc + (respuestas[id] ?? 3), 0);
  return Math.round(((sum - 5) / 20) * 25);
}

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
      dolor_muscular: data.dolor_muscular,
      estres: data.estres,
      motivacion: data.motivacion,
    };

    const score = Math.max(0, Math.min(25, calcularScore025(respuestas)));

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
