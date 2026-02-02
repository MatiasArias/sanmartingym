import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getJugadores, createJugador, getAllCategorias } from '@/lib/redis';
import { z } from 'zod';

const bodySchema = z.object({
  dni: z.string().min(7, 'DNI: mínimo 7 dígitos').max(8, 'DNI: máximo 8 dígitos'),
  nombre: z.string().min(1, 'Nombre obligatorio'),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  categoria_id: z.string().min(1, 'Categoría obligatoria'),
});

export async function GET() {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const jugadores = await getJugadores();
    return NextResponse.json({ jugadores });
  } catch {
    return NextResponse.json({ error: 'Error al listar jugadores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = bodySchema.parse(body);

    const categorias = await getAllCategorias();
    if (!categorias.some((c) => c.id === data.categoria_id)) {
      return NextResponse.json({ error: 'Categoría no válida' }, { status: 400 });
    }

    const jugador = await createJugador(data);
    return NextResponse.json({ jugador });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes('Ya existe')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear jugador' }, { status: 500 });
  }
}
