import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { addComentarioEjercicio, getComentariosByEjercicio } from '@/lib/redis';
import { z } from 'zod';

const comentarioSchema = z.object({
  ejercicio_id: z.string().min(1),
  texto: z.string().min(1).max(500),
  anonimo: z.boolean().optional().default(true),
});

/** GET: Lista comentarios de un ejercicio. Solo staff. */
export async function GET(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'Solo el staff puede ver comentarios' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ejercicioId = searchParams.get('ejercicio_id');
    if (!ejercicioId) {
      return NextResponse.json({ error: 'ejercicio_id requerido' }, { status: 400 });
    }

    const comentarios = await getComentariosByEjercicio(ejercicioId);
    return NextResponse.json({ comentarios });
  } catch {
    return NextResponse.json({ error: 'Error al obtener comentarios' }, { status: 500 });
  }
}

/** POST: Crear comentario. Solo staff (para registrar feedback de jugadores). */
export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'Solo el staff puede agregar comentarios' }, { status: 403 });
    }

    const body = await request.json();
    const data = comentarioSchema.parse(body);

    // Staff puede indicar nombre (ej: jugador que reportó) o anónimo
    let usuario_nombre: string | undefined;
    if (!data.anonimo && body.usuario_nombre) {
      usuario_nombre = body.usuario_nombre as string;
    }

    const comentario = await addComentarioEjercicio({
      ejercicio_id: data.ejercicio_id,
      texto: data.texto.trim(),
      timestamp: new Date().toISOString(),
      anonimo: data.anonimo,
      usuario_nombre,
    });

    return NextResponse.json({ comentario });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al guardar comentario' },
      { status: 500 }
    );
  }
}
