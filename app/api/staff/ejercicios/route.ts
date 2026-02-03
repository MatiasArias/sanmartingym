import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getAllPlantillasEjercicio, createPlantillaEjercicio } from '@/lib/redis';
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

export async function GET() {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const plantillas = await getAllPlantillasEjercicio();
    return NextResponse.json({ ejercicios: plantillas });
  } catch {
    return NextResponse.json({ error: 'Error al listar ejercicios' }, { status: 500 });
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

    const plantilla = await createPlantillaEjercicio(data);
    return NextResponse.json({ ejercicio: plantilla });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Error al crear ejercicio' }, { status: 500 });
  }
}
