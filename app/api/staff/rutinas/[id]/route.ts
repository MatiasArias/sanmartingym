import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import {
  getRutinaById,
  updateRutina,
  saveEjerciciosForRutina,
  getAllCategorias,
} from '@/lib/redis';
import { z } from 'zod';

const DIAS_VALIDOS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
const TIPOS_DIA = ['partido', 'descanso', 'ejercicio'] as const;

const configSemanaSchema = z.object({
  series: z.number().int().min(1),
  rir: z.number().int().min(0),
  nota: z.string().optional(),
});

const ejercicioSchema = z.object({
  id: z.string().optional(),
  ejercicio_plantilla_id: z.string().min(1),
  dia: z.enum(DIAS_VALIDOS),
  orden: z.number().int().min(0),
  config_por_semana: z.record(z.union([z.string(), z.number()]), configSemanaSchema),
});

const bodySchema = z.object({
  categoria_id: z.string().min(1),
  nombre: z.string().min(1),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  semanas: z.number().int().min(1).default(4),
  dias_config: z.record(z.enum(DIAS_VALIDOS), z.enum(TIPOS_DIA)).optional(),
  ejercicios: z.array(ejercicioSchema).default([]),
});

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
    const rutina = await getRutinaById(id);
    if (!rutina) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const data = bodySchema.parse(body);

    const categorias = await getAllCategorias();
    if (!categorias.some((c) => c.id === data.categoria_id)) {
      return NextResponse.json({ error: 'Categoría no válida' }, { status: 400 });
    }

    await updateRutina({
      ...rutina,
      categoria_id: data.categoria_id,
      nombre: data.nombre,
      fecha_inicio: data.fecha_inicio,
      semanas: data.semanas,
      dias_config: data.dias_config ?? rutina.dias_config ?? {},
    });

    await saveEjerciciosForRutina(
      id,
      data.ejercicios.map((e) => ({
        id: e.id,
        ejercicio_plantilla_id: e.ejercicio_plantilla_id,
        dia: e.dia,
        orden: e.orden,
        circuito_nombre: e.circuito_nombre,
        config_por_semana: e.config_por_semana,
      })),
      data.semanas
    );

    const rutinaActualizada = await getRutinaById(id);
    return NextResponse.json({ rutina: rutinaActualizada });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al actualizar rutina' },
      { status: 500 }
    );
  }
}
