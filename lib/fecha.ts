/**
 * Utilidades de fecha en zona horaria Argentina.
 * Toda la aplicación debe usar estas funciones para "hoy" y rangos de fechas
 * para evitar que el servidor (UTC) registre el día siguiente o anterior.
 */

export const TZ_ARGENTINA = 'America/Argentina/Buenos_Aires' as const;

/**
 * Devuelve la fecha de hoy en Argentina en formato YYYY-MM-DD.
 * Usar en APIs y en lib al guardar asistencia, registros, RPE, wellness, etc.
 */
export function getFechaHoyArgentina(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ_ARGENTINA });
}

/**
 * Devuelve mes (1-12) y año actuales en Argentina.
 */
export function getMesAnioHoyArgentina(): { mes: number; anio: number } {
  const parts = getFechaHoyArgentina().split('-');
  return {
    anio: parseInt(parts[0]!, 10),
    mes: parseInt(parts[1]!, 10),
  };
}

/**
 * Itera todos los días entre dos fechas YYYY-MM-DD (inclusive) sin depender de UTC.
 * Útil para bucles de asistencia y rangos.
 */
export function iterarDiasEntre(desde: string, hasta: string): string[] {
  const out: string[] = [];
  const [yD, mD, dD] = desde.split('-').map(Number);
  const [yH, mH, dH] = hasta.split('-').map(Number);
  const start = new Date(yD!, mD! - 1, dD!);
  const end = new Date(yH!, mH! - 1, dH!);
  const current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    out.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return out;
}

/**
 * Dado un Date, devuelve YYYY-MM-DD en zona Argentina.
 */
export function dateToFechaArgentina(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ_ARGENTINA });
}

/**
 * Rango lunes–domingo de la semana actual en Argentina.
 */
export function getCurrentWeekRangeArgentina(): { desde: string; hasta: string } {
  const hoy = getFechaHoyArgentina();
  const [y, m, d] = hoy.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
  const day = date.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - offset);
  const lunes = date.toISOString().split('T')[0]!;
  date.setUTCDate(date.getUTCDate() + 6);
  const domingo = date.toISOString().split('T')[0]!;
  return { desde: lunes, hasta: domingo };
}

/**
 * Rango últimos 30 días (hoy inclusive) en Argentina.
 */
export function getLast30DaysRangeArgentina(): { desde: string; hasta: string } {
  const hasta = getFechaHoyArgentina();
  const [y, m, d] = hasta.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() - 29);
  const desde = date.toISOString().split('T')[0]!;
  return { desde, hasta };
}

/**
 * Día de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado) para la fecha de hoy en Argentina.
 */
export function getDiaSemanaHoyArgentina(): number {
  const hoy = getFechaHoyArgentina();
  const [y, m, d] = hoy.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0)).getUTCDay();
}
