import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getUsuarioById, updateUsuario } from '@/lib/redis';
import { z } from 'zod';

const bodySchema = z.object({
  peso_kg: z.number().min(20).max(300).nullable().optional(),
  activo: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: jugadorId } = await params;
    const jugador = await getUsuarioById(jugadorId);
    if (!jugador || jugador.rol !== 'jugador') {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const data = bodySchema.parse(body);

    const actualizado = {
      ...jugador,
      ...(data.peso_kg !== undefined && { peso_kg: data.peso_kg ?? undefined }),
      ...(data.activo !== undefined && { activo: data.activo }),
    };
    await updateUsuario(actualizado);

    return NextResponse.json({ jugador: actualizado });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al actualizar jugador' },
      { status: 500 }
    );
  }
}
