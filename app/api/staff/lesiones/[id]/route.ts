import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { z } from 'zod';
import { getLesionById, updateLesion, darAltaLesion } from '@/lib/lesiones';
import { getFechaHoyArgentina } from '@/lib/fecha';

const updateSchema = z.object({
  musculo: z.string().min(1).optional(),
  contexto: z.string().min(1).optional(),
  tipo: z.string().min(1).optional(),
  fecha_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  fecha_alta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  notas: z.string().optional(),
});

async function requireStaff() {
  const payload = await getTokenPayload();
  if (!payload || payload.rol !== 'staff') return null;
  return payload;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireStaff())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const lesion = await getLesionById(id);
    if (!lesion) return NextResponse.json({ error: 'Lesión no encontrada' }, { status: 404 });
    return NextResponse.json({ lesion });
  } catch {
    return NextResponse.json({ error: 'Error al obtener lesión' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireStaff())) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const lesion = await getLesionById(id);
    if (!lesion) return NextResponse.json({ error: 'Lesión no encontrada' }, { status: 404 });

    const body = await request.json();

    // Ruta especial: dar alta
    if (body.action === 'dar_alta') {
      const updated = await darAltaLesion(id, getFechaHoyArgentina());
      return NextResponse.json({ ok: true, lesion: updated });
    }

    const data = updateSchema.parse(body);
    const updated = await updateLesion(id, data);
    return NextResponse.json({ ok: true, lesion: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar lesión' }, { status: 500 });
  }
}
