'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import { getSeriesEstado, setSeriesEstado, type SerieEstado } from '@/lib/rutina-storage';

interface PesoFormProps {
  rutinaId: string;
  dia: string;
  ejercicioId: string;
  series: number;
  repeticiones: number;
  rir: number;
}

function estadoInicial(totalSeries: number, repeticiones: number, rir: number): SerieEstado[] {
  return Array.from({ length: totalSeries }, () => ({
    completada: false,
    reps: String(repeticiones),
    rir: String(rir),
    peso: '',
  }));
}

export default function PesoForm({ rutinaId, dia, ejercicioId, series: totalSeries, repeticiones, rir }: PesoFormProps) {
  const [estado, setEstado] = useState<SerieEstado[]>(() => estadoInicial(totalSeries, repeticiones, rir));

  // Cargar estado guardado una sola vez al montar o al cambiar día/ejercicio
  useEffect(() => {
    const stored = getSeriesEstado(rutinaId, dia, ejercicioId, totalSeries);
    if (stored) {
      setEstado(stored);
    } else {
      setEstado(estadoInicial(totalSeries, repeticiones, rir));
    }
  }, [rutinaId, dia, ejercicioId, totalSeries, repeticiones, rir]);

  const persistir = useCallback(
    (nuevo: SerieEstado[]) => {
      setSeriesEstado(rutinaId, dia, ejercicioId, nuevo);
    },
    [rutinaId, dia, ejercicioId]
  );

  const toggleSerie = useCallback(
    (index: number) => {
      setEstado((prev) => {
        const next = prev.map((s, i) => (i === index ? { ...s, completada: !s.completada } : s));
        persistir(next);
        return next;
      });
    },
    [persistir]
  );

  const actualizarPeso = useCallback(
    (index: number, value: string) => {
      setEstado((prev) => prev.map((s, i) => (i === index ? { ...s, peso: value } : s)));
    },
    []
  );

  const guardarAlSalir = useCallback(
    (index: number) => {
      setEstado((prev) => {
        persistir(prev);
        return prev;
      });
    },
    [persistir]
  );

  const completadasCount = estado.filter((s) => s.completada).length;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Series ({completadasCount}/{totalSeries}) — solo cargá el peso
      </div>
      <ul className="space-y-2">
        {estado.map((serie, i) => (
          <li
            key={i}
            className={`flex flex-wrap items-center gap-2 py-2 px-3 rounded-lg border ${
              serie.completada ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className="text-sm font-medium text-gray-600 shrink-0">
              Serie {i + 1} — {repeticiones} repeticiones ({rir} RIR)
            </span>
            <label className="sr-only">Peso (kg)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              placeholder="Kg"
              value={serie.peso}
              onChange={(e) => actualizarPeso(i, e.target.value)}
              onBlur={() => guardarAlSalir(i)}
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
            />
            <span className="text-sm text-gray-500">kg</span>
            <button
              type="button"
              onClick={() => toggleSerie(i)}
              className={`ml-auto flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-medium transition ${
                serie.completada
                  ? 'bg-sanmartin-red text-white'
                  : 'bg-white border border-gray-300 text-gray-500 hover:border-sanmartin-red hover:text-sanmartin-red'
              }`}
              aria-label={serie.completada ? 'Marcar como no hecha' : 'Marcar como hecha'}
              title={serie.completada ? 'Desmarcar' : 'Hecha'}
            >
              <Check size={20} strokeWidth={2.5} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
