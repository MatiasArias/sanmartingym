import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getAllCategorias, createCategoria } from '@/lib/redis';
import { z } from 'zod';

const bodySchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').trim(),
});

export async function GET() {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const categorias = await getAllCategorias();
    return NextResponse.json({ categorias });
  } catch {
    return NextResponse.json({ error: 'Error al listar categorías' }, { status: 500 });
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

    const categoria = await createCategoria({ nombre: data.nombre });
    return NextResponse.json({ categoria });
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
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}
