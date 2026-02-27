import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { z } from 'zod';
import {
  createLesion,
  getAllLesiones,
  getLesionesByJugador,
  getLesionesEnRango,
} from '@/lib/lesiones';

const createSchema = z.object({
  jugador_id: z.string().min(1),
  musculo: z.string().min(1),
  contexto: z.string().min(1),
  tipo: z.string().min(1),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  notas: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jugadorId = searchParams.get('jugador_id');
    const soloActivas = searchParams.get('activas');
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');

    let lesiones;
    if (desde && hasta) {
      lesiones = await getLesionesEnRango(desde, hasta);
    } else if (jugadorId) {
      lesiones = await getLesionesByJugador(jugadorId);
    } else {
      lesiones = await getAllLesiones();
    }

    if (soloActivas === 'true') {
      lesiones = lesiones.filter((l) => l.activa);
    } else if (soloActivas === 'false') {
      lesiones = lesiones.filter((l) => !l.activa);
    }

    return NextResponse.json({ lesiones });
  } catch {
    return NextResponse.json({ error: 'Error al obtener lesiones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = createSchema.parse(body);
    const lesion = await createLesion(data);
    return NextResponse.json({ ok: true, lesion }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear lesión' }, { status: 500 });
  }
}
