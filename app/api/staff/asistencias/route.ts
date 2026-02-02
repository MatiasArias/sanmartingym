import { NextRequest, NextResponse } from 'next/server';
import { getTokenPayload } from '@/lib/auth';
import { getAllUsuarios, redis, getRpeSesion } from '@/lib/redis';

/** Días del mes (1-28/29/30/31) para un año dado */
function getDiasDelMes(anio: number, mes: number): string[] {
  const ultimo = new Date(anio, mes, 0).getDate();
  const dias: string[] = [];
  for (let d = 1; d <= ultimo; d++) {
    const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dias.push(fecha);
  }
  return dias;
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getTokenPayload();
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vista = searchParams.get('vista') || 'dia'; // 'dia' | 'mes'
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    const mesParam = searchParams.get('mes');
    const anioParam = searchParams.get('anio');
    const categoriaId = searchParams.get('categoria');

    const hoy = new Date();
    const mes = mesParam ? parseInt(mesParam, 10) : hoy.getMonth() + 1;
    const anio = anioParam ? parseInt(anioParam, 10) : hoy.getFullYear();

    let jugadores = (await getAllUsuarios()).filter(u => u.rol === 'jugador' && u.activo);

    if (categoriaId) {
      jugadores = jugadores.filter(j => j.categoria_id === categoriaId);
    }

    if (vista === 'mes') {
      const diasDelMes = getDiasDelMes(anio, mes);
      const asistenciasMes = await Promise.all(
        jugadores.map(async (j) => {
          let diasPresente = 0;
          const detalle: { fecha: string; presente: boolean }[] = [];
          for (const dia of diasDelMes) {
            const asistencia = await redis.get(`asistencia:${j.id}:${dia}`);
            const presente = !!asistencia;
            if (presente) diasPresente++;
            detalle.push({ fecha: dia, presente });
          }
          return {
            jugador: j,
            diasPresente,
            totalDias: diasDelMes.length,
            porcentaje: diasDelMes.length > 0
              ? Math.round((diasPresente / diasDelMes.length) * 100)
              : 0,
            detalle,
          };
        })
      );
      return NextResponse.json({
        vista: 'mes',
        mes,
        anio,
        asistencias: asistenciasMes,
        totalDias: diasDelMes.length,
      });
    }

    // Vista por día (comportamiento original)
    const asistencias = await Promise.all(
      jugadores.map(async (j) => {
        const asistencia = await redis.get(`asistencia:${j.id}:${fecha}`);
        const rpeSesion = await getRpeSesion(j.id, fecha);
        return {
          jugador: j,
          presente: !!asistencia,
          rpe: rpeSesion?.rpe ?? null,
        };
      })
    );

    return NextResponse.json({ vista: 'dia', asistencias, fecha });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener asistencias' },
      { status: 400 }
    );
  }
}
