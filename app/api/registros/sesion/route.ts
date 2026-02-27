import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getFechaHoyArgentina } from '@/lib/fecha';
import { redis, type RegistroCarga } from '@/lib/redis';
import { z } from 'zod';

const itemSchema = z.object({
  ejercicio_id: z.string(),
  peso: z.number(),
  reps: z.number(),
  serie_num: z.number(),
});

const sesionSchema = z.object({
  registros: z.array(itemSchema),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Guarda una sesión completa de entrenamiento.
 * REEMPLAZA todos los registros del jugador para esa fecha por los nuevos.
 * Así evitamos duplicados: un solo guardado por día.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'jugador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { registros: items, fecha: fechaParam } = sesionSchema.parse(body);

    const fecha = fechaParam ?? getFechaHoyArgentina();
    const usuarioId = payload.id as string;
    const key = `registros:jugador:${usuarioId}`;

    // 1. Obtener todos los registros actuales
    const existentes = (await redis.lrange(key, 0, -1)) as RegistroCarga[];

    // 2. Mantener solo los de otras fechas
    const deOtrasFechas = (existentes || []).filter((r) => r.fecha !== fecha);

    // 3. Crear los nuevos registros para hoy
    const timestamp = new Date().toISOString();
    const nuevos: RegistroCarga[] = items.map((item, idx) => ({
      id: `registro-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
      usuario_id: usuarioId,
      ejercicio_id: item.ejercicio_id,
      peso: item.peso,
      reps: item.reps,
      serie_num: item.serie_num,
      fecha,
      timestamp,
    }));

    // 4. Reconstruir la lista: nuevos primero, luego los de otras fechas (orden cronológico inverso)
    const todos = [...nuevos, ...deOtrasFechas];
    await redis.del(key);
    if (todos.length > 0) {
      await redis.lpush(key, ...todos);
    }

    return NextResponse.json({ registros: nuevos, reemplazados: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar sesión' },
      { status: 400 }
    );
  }
}
