'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { estimar1RM, pesoParaReps } from '@/lib/calculadora-peso';

export default function CalculadoraPeso() {
  const [peso, setPeso] = useState('');
  const [reps, setReps] = useState('');

  const pesoNum = Math.min(parseFloat(peso) || 0, 500);
  const repsNum = Math.min(parseInt(reps, 10) || 0, 30);
  const oneRM = pesoNum > 0 && repsNum > 0 ? estimar1RM(pesoNum, repsNum) : 0;

  const handlePesoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') {
      setPeso('');
      return;
    }
    const n = parseFloat(v);
    if (!isNaN(n) && n > 500) setPeso('500');
    else setPeso(v);
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '') {
      setReps('');
      return;
    }
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 30) setReps('30');
    else setReps(v);
  };

  const repsObjetivos = [1, 2, 3, 4, 5, 6, 8, 10, 12];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Calculator className="text-sanmartin-red" size={22} />
        Calculadora de peso (1RM)
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Ingresá el peso y las repeticiones que hiciste para estimar tu 1RM y ver con cuánto peso deberías hacer otras repeticiones.
      </p>
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Peso (kg)</label>
          <input
            type="number"
            placeholder="Ej. 60"
            value={peso}
            onChange={handlePesoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
            step="0.5"
            min="0"
            max="500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Repeticiones</label>
          <input
            type="number"
            placeholder="Ej. 8"
            value={reps}
            onChange={handleRepsChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
            min="1"
            max="30"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-2">Máximo 500 kg y 30 reps.</p>
      {oneRM > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="text-center mb-3">
            <span className="text-sm text-gray-600">1RM estimado: </span>
            <span className="text-xl font-bold text-sanmartin-red">{oneRM} kg</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">Peso sugerido por repeticiones:</div>
          <div className="flex flex-wrap gap-2">
            {repsObjetivos.map((r) => (
              <span
                key={r}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium"
              >
                {r} reps → {pesoParaReps(oneRM, r)} kg
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
