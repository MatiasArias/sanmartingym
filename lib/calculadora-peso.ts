/**
 * Calculadora de peso para el jugador.
 * Fórmulas: Epley para 1RM; inversa para peso sugerido según reps objetivo.
 */

/** Estima 1RM a partir de peso × reps (fórmula Epley) */
export function estimar1RM(peso: number, reps: number): number {
  if (reps <= 0 || peso <= 0) return 0;
  if (reps === 1) return peso;
  // Epley: 1RM = peso × (1 + reps/30)
  const oneRM = peso * (1 + reps / 30);
  return Math.round(oneRM * 10) / 10;
}

/** Dado un 1RM estimado y las reps objetivo, sugiere el peso a usar */
export function pesoParaReps(oneRM: number, repsObjetivo: number): number {
  if (oneRM <= 0 || repsObjetivo <= 0) return 0;
  if (repsObjetivo === 1) return oneRM;
  // Inversa Epley: peso = 1RM / (1 + reps/30)
  const peso = oneRM / (1 + repsObjetivo / 30);
  return Math.round(peso * 10) / 10;
}

/** A partir de último registro (peso, reps) y reps objetivo del ejercicio, sugiere peso */
export function sugerirPesoDesdeRegistro(
  pesoUsado: number,
  repsHechas: number,
  repsObjetivo: number
): number | null {
  if (pesoUsado <= 0 || repsHechas <= 0) return null;
  const oneRM = estimar1RM(pesoUsado, repsHechas);
  return pesoParaReps(oneRM, repsObjetivo);
}
