'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { getSeriesEstado, setSeriesEstado, type SerieEstado } from '@/lib/rutina-storage';

interface MovilidadReadyProps {
  rutinaId: string;
  dia: string;
  ejercicioId: string;
}

/**
 * Componente para ejercicios de tipo "movilidad".
 * El jugador solo marca el ejercicio como listo, sin cargar peso.
 * Persistimos el estado en localStorage reutilizando la misma clave que las series,
 * pero usando siempre una única "serie" virtual.
 */
export default function MovilidadReady({ rutinaId, dia, ejercicioId }: MovilidadReadyProps) {
  const [completada, setCompletada] = useState(false);

  useEffect(() => {
    const estado = getSeriesEstado(rutinaId, dia, ejercicioId, 1);
    if (estado && estado[0]) {
      setCompletada(estado[0].completada);
    }
  }, [rutinaId, dia, ejercicioId]);

  const toggle = useCallback(() => {
    setCompletada((prev) => {
      const next = !prev;
      const serie: SerieEstado = {
        completada: next,
        reps: '1',
        rir: '0',
        peso: '',
      };
      setSeriesEstado(rutinaId, dia, ejercicioId, [serie]);
      return next;
    });
  }, [rutinaId, dia, ejercicioId]);

  return (
    <div className="flex items-center justify-between gap-3 mt-2">
      <p className="text-sm text-gray-600">
        Este es un ejercicio de <span className="font-semibold">movilidad / activación</span>. Solo
        marcá cuando lo termines.
      </p>
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
          completada
            ? 'bg-green-600 text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:border-green-600 hover:text-green-700'
        }`}
      >
        <Check size={18} />
        {completada ? 'Listo' : 'Marcar listo'}
      </button>
    </div>
  );
}

