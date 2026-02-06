import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { createRutina, saveEjerciciosForRutina, getAllCategorias } from '@/lib/redis';
import { z } from 'zod';

const DIAS_VALIDOS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
const TIPOS_DIA = ['partido', 'descanso', 'ejercicio'] as const;

const configSemanaSchema = z.object({
  series: z.number().int().min(1),
  repeticiones: z.number().int().min(1).optional(),
  rir: z.number().int().min(0),
  nota: z.string().optional(),
});

const ejercicioSchema = z.object({
  id: z.string().optional(),
  ejercicio_plantilla_id: z.string().min(1),
  dia: z.enum(DIAS_VALIDOS),
  orden: z.number().int().min(0),
  circuito_nombre: z.string().optional(),
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

    const rutina = await createRutina({
      categoria_id: data.categoria_id,
      nombre: data.nombre,
      fecha_inicio: data.fecha_inicio,
      semanas: data.semanas,
      dias_config: data.dias_config ?? {},
    });

    if (data.ejercicios.length > 0) {
      await saveEjerciciosForRutina(
        rutina.id,
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
    }

    return NextResponse.json({ rutina });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al crear rutina' },
      { status: 500 }
    );
  }
}
