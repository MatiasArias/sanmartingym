import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { markComentarioResuelto } from '@/lib/redis';
import { z } from 'zod';

const schema = z.object({
  comentario_id: z.string().min(1),
  ejercicio_id: z.string().min(1),
  ejercicio_nombre: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'Solo el staff puede resolver comentarios' }, { status: 403 });
    }

    const body = await request.json();
    const data = schema.parse(body);

    await markComentarioResuelto(data.comentario_id, data.ejercicio_id, data.ejercicio_nombre);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al resolver comentario' }, { status: 500 });
  }
}
