import { describe, it, expect } from 'vitest';
import { estimar1RM, pesoParaReps, sugerirPesoDesdeRegistro } from './calculadora-peso';

describe('calculadora-peso', () => {
  describe('estimar1RM', () => {
    it('devuelve 0 si reps <= 0 o peso <= 0', () => {
      expect(estimar1RM(0, 5)).toBe(0);
      expect(estimar1RM(100, 0)).toBe(0);
    });
    it('con 1 rep devuelve el peso', () => {
      expect(estimar1RM(100, 1)).toBe(100);
    });
    it('Epley: 100kg x 5 reps estima ~116.7 kg 1RM', () => {
      const oneRM = estimar1RM(100, 5);
      expect(oneRM).toBeGreaterThan(116);
      expect(oneRM).toBeLessThan(117);
    });
  });

  describe('pesoParaReps', () => {
    it('con 1 rep objetivo devuelve el 1RM', () => {
      expect(pesoParaReps(100, 1)).toBe(100);
    });
    it('inversa Epley: 1RM 100kg para 5 reps da ~85.7 kg', () => {
      const peso = pesoParaReps(100, 5);
      expect(peso).toBeGreaterThan(85);
      expect(peso).toBeLessThan(86);
    });
  });

  describe('sugerirPesoDesdeRegistro', () => {
    it('devuelve null si pesoUsado <= 0 o repsHechas <= 0', () => {
      expect(sugerirPesoDesdeRegistro(0, 5, 5)).toBeNull();
      expect(sugerirPesoDesdeRegistro(100, 0, 5)).toBeNull();
    });
    it('sugiere peso coherente: 100kg x 5 → objetivo 8 reps da menos peso', () => {
      const sugerido = sugerirPesoDesdeRegistro(100, 5, 8);
      expect(sugerido).not.toBeNull();
      expect(sugerido!).toBeLessThan(100);
      expect(sugerido!).toBeGreaterThan(80);
    });
  });
});
