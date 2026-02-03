'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { getRPEFromStorage, setRPEInStorage, getSeriesEstado } from '@/lib/rutina-storage';

interface EjercicioParaHistorial {
  id: string;
  series: number;
}

interface EscalaRPEProps {
  rutinaId: string;
  dia: string;
  ejercicios: EjercicioParaHistorial[];
}

const RPE_LABELS: Record<number, string> = {
  1: 'Muy fácil',
  2: 'Fácil',
  3: 'Moderado',
  4: 'Algo duro',
  5: 'Duro',
  6: 'Muy duro',
  7: 'Muy muy duro',
  8: 'Extremo',
  9: 'Casi máximo',
  10: 'Máximo',
};

export default function EscalaRPE({ rutinaId, dia, ejercicios }: EscalaRPEProps) {
  const router = useRouter();
  const [rpe, setRpe] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Cargar RPE guardado una sola vez al montar o al cambiar día
  useEffect(() => {
    const stored = getRPEFromStorage(rutinaId, dia);
    setRpe(stored);
  }, [rutinaId, dia]);

  const selectRPE = (n: number) => {
    setRpe(n);
    setRPEInStorage(rutinaId, dia, n);
  };

  const handleSubmit = async () => {
    if (rpe == null) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/rpe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpe, rutina_id: rutinaId, dia }),
      });
      if (!res.ok) throw new Error('Error');

      // Recolectar registros de la sesión (desde localStorage) y guardar como sesión única por día
      const registros: { ejercicio_id: string; peso: number; reps: number; serie_num: number }[] = [];
      for (const ej of ejercicios) {
        const estado = getSeriesEstado(rutinaId, dia, ej.id, ej.series);
        if (!estado) continue;
        for (let i = 0; i < estado.length; i++) {
          const s = estado[i];
          const peso = s.peso.trim() ? parseFloat(s.peso) : NaN;
          const reps = s.reps.trim() ? parseInt(s.reps, 10) : NaN;
          if (Number.isFinite(peso) && Number.isFinite(reps)) {
            registros.push({ ejercicio_id: ej.id, peso, reps, serie_num: i + 1 });
          }
        }
      }
      if (registros.length > 0) {
        const hoy = new Date().toISOString().split('T')[0];
        await fetch('/api/registros/sesion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registros, fecha: hoy }),
        });
      }
      await fetch('/api/asistencia', { method: 'POST' });

      setMessage('✅ Guardado. Redirigiendo al inicio...');
      router.push('/home');
    } catch {
      setMessage('❌ Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-sanmartin-red">
      <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Activity className="text-sanmartin-red" size={20} />
        Escala RPE – ¿Qué tan cansado estuviste?
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Marcá del 1 al 10 cuánto te costó la rutina (1 = muy fácil, 10 = máximo esfuerzo).
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => selectRPE(n)}
            className={`w-10 h-10 rounded-lg font-semibold transition ${
              rpe === n
                ? 'bg-sanmartin-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {rpe != null && (
        <p className="text-sm text-gray-500 mb-3">{RPE_LABELS[rpe]}</p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || rpe == null}
        className="w-full py-2 bg-sanmartin-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Guardando...' : 'Finalizar jornada'}
      </button>
      {message && (
        <p className={`text-sm mt-3 ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
