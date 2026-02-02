/**
 * Claves y helpers para persistir el estado de la rutina por día en localStorage.
 * Así el estado no se pierde al cambiar de día o de pestaña.
 */

const PREFIX = 'sanmartin:rutina';

export function keySeriesEstado(rutinaId: string, dia: string, ejercicioId: string): string {
  return `${PREFIX}:${rutinaId}:${dia}:ejercicio:${ejercicioId}:estado`;
}

/** Estado de una serie: completada + reps y RIR editables por el jugador. */
export interface SerieEstado {
  completada: boolean;
  reps: string;
  rir: string;
}

export function keyRPE(rutinaId: string, dia: string): string {
  return `${PREFIX}:${rutinaId}:${dia}:rpe`;
}

/** Obtiene el estado de las series (completada, reps, rir). Si no hay guardado o no coincide el largo, devuelve null. */
export function getSeriesEstado(rutinaId: string, dia: string, ejercicioId: string, totalSeries: number): SerieEstado[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(keySeriesEstado(rutinaId, dia, ejercicioId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== totalSeries) return null;
    const ok = parsed.every(
      (s) =>
        s && typeof s === 'object' && typeof (s as SerieEstado).completada === 'boolean' && typeof (s as SerieEstado).reps === 'string' && typeof (s as SerieEstado).rir === 'string'
    );
    return ok ? (parsed as SerieEstado[]) : null;
  } catch {
    return null;
  }
}

/** Guarda el estado de las series (solo al hacer clic en [✓] o al salir del campo reps/rir). */
export function setSeriesEstado(rutinaId: string, dia: string, ejercicioId: string, estado: SerieEstado[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(keySeriesEstado(rutinaId, dia, ejercicioId), JSON.stringify(estado));
  } catch {
    // quota or disabled
  }
}

export function getRPEFromStorage(rutinaId: string, dia: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(keyRPE(rutinaId, dia));
    if (raw == null) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 1 && n <= 10 ? n : null;
  } catch {
    return null;
  }
}

export function setRPEInStorage(rutinaId: string, dia: string, rpe: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(keyRPE(rutinaId, dia), String(rpe));
  } catch {
    // quota or disabled
  }
}
