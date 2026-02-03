'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Plus, Trash2 } from 'lucide-react';
import type { ReglaWellness } from '@/lib/redis';

interface ReglasWellnessFormProps {
  reglasIniciales: ReglaWellness[];
}

const METRIC_LABEL: Record<string, string> = {
  bienestar: 'Bienestar (sueño + energía)',
  cansancio: 'Cansancio / estrés',
};

const ACTION_LABEL: Record<string, string> = {
  quitar_reps: 'Quitar repeticiones',
  quitar_series: 'Quitar series',
};

const OPERATOR_LABEL: Record<string, string> = {
  '<': 'es menor',
  '<=': 'es menor o igual',
};

export default function ReglasWellnessForm({ reglasIniciales }: ReglasWellnessFormProps) {
  const router = useRouter();
  const [reglas, setReglas] = useState<ReglaWellness[]>(reglasIniciales);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const agregarRegla = () => {
    setReglas((prev) => [
      ...prev,
      { metric: 'bienestar', operator: '<', threshold: 2, action: 'quitar_reps', amount: 1 },
    ]);
  };

  const quitarRegla = (index: number) => {
    setReglas((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarRegla = (index: number, field: keyof ReglaWellness, value: ReglaWellness[keyof ReglaWellness]) => {
    setReglas((prev) => {
      const next = [...prev];
      (next[index] as unknown as Record<string, unknown>)[field] = value;
      return next;
    });
  };

  const guardar = async () => {
    setLoading(true);
    setError('');
    setMensaje('');
    try {
      const res = await fetch('/api/staff/wellness-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: reglas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setMensaje('Reglas guardadas correctamente.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-sanmartin-red">
      <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Heart className="text-sanmartin-red" size={24} />
        Reglas de adaptación
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Si el jugador completa el cuestionario y una métrica cumple la condición, se aplica la acción a la rutina del día.
      </p>

      <div className="space-y-4">
        {reglas.map((r, index) => (
          <div key={index} className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Métrica</label>
              <select
                value={r.metric}
                onChange={(e) => actualizarRegla(index, 'metric', e.target.value as 'bienestar' | 'cansancio')}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm"
              >
                <option value="bienestar">{METRIC_LABEL.bienestar}</option>
                <option value="cansancio">{METRIC_LABEL.cansancio}</option>
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Si</label>
              <select
                value={r.operator}
                onChange={(e) => actualizarRegla(index, 'operator', e.target.value as '<' | '<=')}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm"
              >
                <option value="<">{OPERATOR_LABEL['<']}</option>
                <option value="<=">{OPERATOR_LABEL['<=']}</option>
              </select>
            </div>
            <div className="w-14">
              <label className="block text-xs font-medium text-gray-500 mb-1">Umbral (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={r.threshold}
                onChange={(e) => actualizarRegla(index, 'threshold', parseInt(e.target.value, 10) || 1)}
                className="w-full py-2 px-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Acción</label>
              <select
                value={r.action}
                onChange={(e) => actualizarRegla(index, 'action', e.target.value as 'quitar_reps' | 'quitar_series')}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm"
              >
                <option value="quitar_reps">{ACTION_LABEL.quitar_reps}</option>
                <option value="quitar_series">{ACTION_LABEL.quitar_series}</option>
              </select>
            </div>
            <div className="w-14">
              <label className="block text-xs font-medium text-gray-500 mb-1">Cant.</label>
              <input
                type="number"
                min={1}
                max={5}
                value={r.amount}
                onChange={(e) => actualizarRegla(index, 'amount', parseInt(e.target.value, 10) || 1)}
                className="w-full py-2 px-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => quitarRegla(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
              aria-label="Quitar regla"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={agregarRegla}
        className="mt-4 flex items-center gap-2 py-2 px-4 text-sm font-medium text-sanmartin-red hover:bg-red-50 rounded-lg border border-sanmartin-red"
      >
        <Plus size={18} />
        Agregar regla
      </button>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={loading}
          className="flex-1 py-3 bg-sanmartin-red text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar reglas'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {mensaje && <p className="mt-3 text-sm text-green-600">{mensaje}</p>}
    </div>
  );
}
