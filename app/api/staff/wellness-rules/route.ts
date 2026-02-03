import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getWellnessRules, setWellnessRules } from '@/lib/redis';
import { z } from 'zod';

const reglaSchema = z.object({
  metric: z.enum(['bienestar', 'cansancio']),
  operator: z.enum(['<', '<=']),
  threshold: z.number().min(1).max(5),
  action: z.enum(['quitar_reps', 'quitar_series']),
  amount: z.number().int().min(1).max(5),
});

const bodySchema = z.object({
  rules: z.array(reglaSchema),
});

export async function GET() {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const rules = await getWellnessRules();
    return NextResponse.json({ rules });
  } catch {
    return NextResponse.json({ error: 'Error al obtener reglas wellness' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const { rules } = bodySchema.parse(body);
    await setWellnessRules(rules);
    return NextResponse.json({ ok: true, rules });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof z.ZodError ? 'Datos inválidos' : 'Error al guardar reglas wellness' },
      { status: 400 }
    );
  }
}
