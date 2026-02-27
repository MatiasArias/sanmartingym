import { NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getAlertas } from '@/lib/alertas';

export async function GET() {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const alertas = await getAlertas();
    return NextResponse.json({ alertas });
  } catch {
    return NextResponse.json({ error: 'Error al obtener alertas' }, { status: 500 });
  }
}
