'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

const PREGUNTAS = [
  { id: 'sueno', label: '¿Cómo dormiste anoche?', low: 'Mal', high: 'Muy bien' },
  { id: 'energia', label: '¿Cuánta energía tenés hoy?', low: 'Nada', high: 'Mucha' },
  { id: 'dolor_muscular', label: '¿Dolor o molestia muscular?', low: 'Mucho', high: 'Nada' },
  { id: 'estres', label: '¿Nivel de estrés o cansancio mental?', low: 'Muy alto', high: 'Bajo' },
] as const;

export default function CuestionarioWellness() {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, number>>({
    sueno: 5,
    energia: 5,
    dolor_muscular: 5,
    estres: 5,
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
      router.refresh();
    } catch {
      setError('Error al guardar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const promedio = Object.values(valores).reduce((a, b) => a + b, 0) / Object.keys(valores).length;
  const scoreRedondeado = Math.round(promedio * 10) / 10;

  const handleOmitir = () => router.refresh();

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-sanmartin-red">
      <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Heart className="text-sanmartin-red" size={24} />
        Cuestionario Wellness <span className="text-xs font-normal text-gray-500">(opcional)</span>
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Contanos cómo te sentís. Si completás el cuestionario y tu puntaje es bajo, te mostramos la rutina con menos series o repeticiones para que te recuperes mejor.
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
                  max={10}
                  value={valores[p.id] ?? 5}
                  onChange={(e) => handleChange(p.id, parseInt(e.target.value, 10))}
                  className="flex-1 h-3 rounded-lg appearance-none bg-gray-200 accent-sanmartin-red"
                />
                <span className="text-xs text-gray-500 w-20 text-right">{p.high}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span className="font-medium text-sanmartin-red">{valores[p.id] ?? 5}</span>
                <span>10</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-2">
            Tu puntaje hoy: <strong className="text-sanmartin-red">{scoreRedondeado}/10</strong>
            {scoreRedondeado < 6 && (
              <span className="block text-xs text-amber-600 mt-1">
                Te vamos a mostrar la rutina con una serie o repetición menos para que te recuperes mejor.
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOmitir}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Omitir — ver rutina
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-sanmartin-red text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Enviar'}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
    </div>
  );
}
