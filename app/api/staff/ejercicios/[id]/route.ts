import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import {
  getPlantillaEjercicioById,
  updatePlantillaEjercicio,
  deletePlantillaEjercicio,
} from '@/lib/redis';
import { z } from 'zod';

const TIPOS = ['empuje', 'traccion', 'movilidad'] as const;
const MODOS_SERIE = ['serie_x_repeticion', 'serie_x_minutos', 'serie_x_brazo'] as const;

const bodySchema = z.object({
  nombre: z.string().min(1),
  series_default: z.number().int().min(1),
  rir_default: z.number().int().min(0),
  repeticiones_default: z.number().int().min(1),
  tipo: z.enum(TIPOS),
  musculo_principal: z.string().min(1),
  modo_serie: z.enum(MODOS_SERIE),
  ayuda_alumno: z.string().default(''),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const plantilla = await getPlantillaEjercicioById(id);
    if (!plantilla) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ ejercicio: plantilla });
  } catch {
    return NextResponse.json({ error: 'Error al obtener ejercicio' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const plantilla = await getPlantillaEjercicioById(id);
    if (!plantilla) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const data = bodySchema.parse(body);

    await updatePlantillaEjercicio({ ...plantilla, ...data });
    const actualizada = await getPlantillaEjercicioById(id);
    return NextResponse.json({ ejercicio: actualizada });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Error al actualizar ejercicio' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const plantilla = await getPlantillaEjercicioById(id);
    if (!plantilla) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
    }

    await deletePlantillaEjercicio(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar ejercicio' }, { status: 500 });
  }
}
