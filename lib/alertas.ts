import { getJugadores } from '@/lib/usuarios';
import { getAsistenciasJugadorEnRango } from '@/lib/asistencia';
import { iterarDiasEntre, getFechaHoyArgentina, getLast30DaysRangeArgentina } from '@/lib/fecha';

export type TipoAlerta = 'sin_entrenar_7d' | 'baja_asistencia';

export interface Alerta {
  tipo: TipoAlerta;
  jugador_id: string;
  jugador_nombre: string;
  mensaje: string;
  /** Dato extra: días sin entrenar o % asistencia */
  valor: number;
}

/** Umbral de asistencia mensual considerado bajo (porcentaje). */
const UMBRAL_ASISTENCIA_BAJA = 50;

/** Días de inactividad que disparan alerta. */
const DIAS_INACTIVIDAD = 7;

/**
 * Calcula todas las alertas activas del plantel.
 * - sin_entrenar_7d: jugador sin registros de asistencia en los últimos 7 días.
 * - baja_asistencia: jugador con asistencia < 50% en los últimos 30 días.
 */
export async function getAlertas(): Promise<Alerta[]> {
  const hoy = getFechaHoyArgentina();

  // Rango últimos 7 días
  const fechaHace7 = (() => {
    const [y, m, d] = hoy.split('-').map(Number);
    const date = new Date(Date.UTC(y!, m! - 1, d!, 12));
    date.setUTCDate(date.getUTCDate() - DIAS_INACTIVIDAD);
    return date.toISOString().split('T')[0]!;
  })();

  const { desde: desde30, hasta: hasta30 } = getLast30DaysRangeArgentina();
  const diasUltimos30 = iterarDiasEntre(desde30, hasta30).length;

  const jugadores = await getJugadores();
  const alertas: Alerta[] = [];

  await Promise.all(
    jugadores
      .filter((j) => j.activo)
      .map(async (jugador) => {
        // Asistencias últimos 7 días
        const asistencias7 = await getAsistenciasJugadorEnRango(jugador.id, fechaHace7, hoy);
        if (asistencias7.length === 0) {
          alertas.push({
            tipo: 'sin_entrenar_7d',
            jugador_id: jugador.id,
            jugador_nombre: jugador.nombre,
            mensaje: `Sin entrenar en los últimos ${DIAS_INACTIVIDAD} días`,
            valor: DIAS_INACTIVIDAD,
          });
        }

        // Asistencias últimos 30 días
        const asistencias30 = await getAsistenciasJugadorEnRango(jugador.id, desde30, hasta30);
        const porcentaje = Math.round((asistencias30.length / diasUltimos30) * 100);
        if (porcentaje < UMBRAL_ASISTENCIA_BAJA) {
          alertas.push({
            tipo: 'baja_asistencia',
            jugador_id: jugador.id,
            jugador_nombre: jugador.nombre,
            mensaje: `Asistencia baja: ${porcentaje}% en el último mes`,
            valor: porcentaje,
          });
        }
      })
  );

  // Ordenar: sin entrenar primero, luego baja asistencia
  return alertas.sort((a, b) => {
    const order: Record<TipoAlerta, number> = { sin_entrenar_7d: 0, baja_asistencia: 1 };
    return order[a.tipo] - order[b.tipo];
  });
}
