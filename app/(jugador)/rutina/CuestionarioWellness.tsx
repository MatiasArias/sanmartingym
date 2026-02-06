'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

const PREGUNTAS = [
  { id: 'sueno', label: '¿Cómo dormiste anoche?', low: 'Mal', high: 'Muy bien' },
  { id: 'energia', label: '¿Cuánta energía tenés hoy?', low: 'Nada', high: 'Mucha' },
  { id: 'dolor_muscular', label: '¿Dolor o molestia muscular?', low: 'Mucho', high: 'Nada' },
  { id: 'estres', label: '¿Nivel de estrés o cansancio mental?', low: 'Muy alto', high: 'Bajo' },
  { id: 'motivacion', label: '¿Motivación para entrenar hoy?', low: 'Nada', high: 'Mucha' },
] as const;

/** Suma de 5 respuestas 1-5 = 5-25; escalado a 0-25 */
function calcularScore025(respuestas: Record<string, number>): number {
  const ids = PREGUNTAS.map((p) => p.id);
  const sum = ids.reduce((acc, id) => acc + (respuestas[id] ?? 3), 0);
  return Math.round(((sum - 5) / 20) * 25);
}

interface CuestionarioWellnessProps {
  /** Si está dentro de un modal: al omitir o al enviar con éxito se llama para cerrar */
  onClose?: () => void;
}

export default function CuestionarioWellness({ onClose }: CuestionarioWellnessProps) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, number>>({
    sueno: 3,
    energia: 3,
    dolor_muscular: 3,
    estres: 3,
    motivacion: 3,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (id: string, v: number) => {
    setValores((prev) => ({ ...prev, [id]: v }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores),
      });
      if (!res.ok) throw new Error('Error al guardar');
      await router.refresh();
      onClose?.();
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const score025 = calcularScore025(valores);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-sanmartin-red">
      <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Heart className="text-sanmartin-red" size={24} />
        Cuestionario Wellness
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Contanos cómo te sentís (1 a 5). Debes completar este cuestionario para ver tu rutina del día. Según tus respuestas, la rutina puede mostrarse con menos series o repeticiones para que te recuperes mejor.
      </p>

        <div className="space-y-6">
          {PREGUNTAS.map((p) => (
            <div key={p.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{p.label}</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">{p.low}</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={valores[p.id] ?? 3}
                  onChange={(e) => handleChange(p.id, parseInt(e.target.value, 10))}
                  className="flex-1 h-3 rounded-lg appearance-none bg-gray-200 accent-sanmartin-red"
                />
                <span className="text-xs text-gray-500 w-20 text-right">{p.high}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span className="font-medium text-sanmartin-red">{valores[p.id] ?? 3}</span>
                <span>5</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-2">
            Puntaje hoy: <strong className="text-sanmartin-red">{score025}/25</strong>
            {score025 < 13 && (
              <span className="block text-xs text-amber-600 mt-1">
                La rutina se adaptará con menos series o repeticiones según las reglas del staff.
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-sanmartin-red text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Enviar y ver rutina'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
    </div>
  );
}
