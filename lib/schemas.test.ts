import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  DNI_MIN_LENGTH,
  DNI_MAX_LENGTH,
  WELLNESS_SCORE_MIN,
  WELLNESS_SCORE_MAX,
  RUTINA_SEMANAS_MIN,
  RUTINA_SEMANAS_MAX,
} from './constants';

const loginSchema = z.object({
  dni: z.string().min(DNI_MIN_LENGTH).max(DNI_MAX_LENGTH),
});

const wellnessSchema = z.object({
  sueno: z.number().min(1).max(5),
  energia: z.number().min(1).max(5),
  dolor_muscular: z.number().min(1).max(5),
  estres: z.number().min(1).max(5),
  motivacion: z.number().min(1).max(5),
});

const reglaWellnessSchema = z.object({
  metric: z.literal('score'),
  operator: z.enum(['<', '<=']),
  threshold: z.number().min(WELLNESS_SCORE_MIN).max(WELLNESS_SCORE_MAX),
  action: z.enum(['quitar_reps', 'quitar_series']),
  amount: z.number().int().min(1).max(5),
});

const rutinaSemanasSchema = z.number().int().min(RUTINA_SEMANAS_MIN).max(RUTINA_SEMANAS_MAX);

describe('schemas', () => {
  describe('login', () => {
    it('acepta DNI válido 7 dígitos', () => {
      const result = loginSchema.safeParse({ dni: '1234567' });
      expect(result.success).toBe(true);
    });

    it('acepta DNI válido 8 dígitos', () => {
      const result = loginSchema.safeParse({ dni: '12345678' });
      expect(result.success).toBe(true);
    });

    it('rechaza DNI con menos de 7 dígitos', () => {
      const result = loginSchema.safeParse({ dni: '123456' });
      expect(result.success).toBe(false);
    });

    it('rechaza DNI con más de 8 dígitos', () => {
      const result = loginSchema.safeParse({ dni: '123456789' });
      expect(result.success).toBe(false);
    });

    it('rechaza cuerpo vacío o sin dni', () => {
      expect(loginSchema.safeParse({}).success).toBe(false);
      expect(loginSchema.safeParse({ dni: '' }).success).toBe(false);
    });
  });

  describe('wellness', () => {
    it('acepta respuestas 1-5 en las 5 preguntas', () => {
      const data = {
        sueno: 3,
        energia: 4,
        dolor_muscular: 2,
        estres: 3,
        motivacion: 5,
      };
      expect(wellnessSchema.safeParse(data).success).toBe(true);
    });

    it('rechaza valor fuera de 1-5', () => {
      expect(wellnessSchema.safeParse({
        sueno: 0, energia: 4, dolor_muscular: 2, estres: 3, motivacion: 5,
      }).success).toBe(false);
      expect(wellnessSchema.safeParse({
        sueno: 3, energia: 6, dolor_muscular: 2, estres: 3, motivacion: 5,
      }).success).toBe(false);
    });
  });

  describe('regla wellness', () => {
    it('acepta regla válida', () => {
      const regla = {
        metric: 'score' as const,
        operator: '<' as const,
        threshold: 10,
        action: 'quitar_reps' as const,
        amount: 1,
      };
      expect(reglaWellnessSchema.safeParse(regla).success).toBe(true);
    });

    it('rechaza threshold fuera de 0-25', () => {
      expect(reglaWellnessSchema.safeParse({
        metric: 'score', operator: '<', threshold: -1, action: 'quitar_reps', amount: 1,
      }).success).toBe(false);
      expect(reglaWellnessSchema.safeParse({
        metric: 'score', operator: '<', threshold: 26, action: 'quitar_reps', amount: 1,
      }).success).toBe(false);
    });
  });

  describe('rutina semanas', () => {
    it('acepta semanas en rango', () => {
      expect(rutinaSemanasSchema.safeParse(RUTINA_SEMANAS_MIN).success).toBe(true);
      expect(rutinaSemanasSchema.safeParse(RUTINA_SEMANAS_MAX).success).toBe(true);
      expect(rutinaSemanasSchema.safeParse(4).success).toBe(true);
    });

    it('rechaza semanas fuera de rango', () => {
      expect(rutinaSemanasSchema.safeParse(0).success).toBe(false);
      expect(rutinaSemanasSchema.safeParse(RUTINA_SEMANAS_MAX + 1).success).toBe(false);
    });
  });
});
