'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EjercicioPlantilla } from '@/lib/redis';

const TIPOS = [
  { value: 'empuje', label: 'Empuje' },
  { value: 'traccion', label: 'Tracción' },
];

const MODOS_SERIE = [
  { value: 'serie_x_repeticion', label: 'Series × Repetición' },
  { value: 'serie_x_minutos', label: 'Series × Minutos' },
  { value: 'serie_x_brazo', label: 'Series × Brazo' },
];

const MUSCULOS = [
  'Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pectorales', 'Dorsales',
  'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Gemelos', 'Otro',
];

interface EjercicioFormProps {
  ejercicio?: EjercicioPlantilla;
}

export default function EjercicioForm({ ejercicio }: EjercicioFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState(ejercicio?.nombre ?? '');
  const [seriesDefault, setSeriesDefault] = useState(ejercicio?.series_default ?? 3);
  const [rirDefault, setRirDefault] = useState(ejercicio?.rir_default ?? 2);
  const [repeticionesDefault, setRepeticionesDefault] = useState(
    ejercicio?.repeticiones_default ?? 10
  );
  const [tipo, setTipo] = useState<'empuje' | 'traccion'>(ejercicio?.tipo ?? 'empuje');
  const [musculoPrincipal, setMusculoPrincipal] = useState(
    ejercicio?.musculo_principal ?? MUSCULOS[0]
  );
  const [modoSerie, setModoSerie] = useState(ejercicio?.modo_serie ?? 'serie_x_repeticion');
  const [ayudaAlumno, setAyudaAlumno] = useState(ejercicio?.ayuda_alumno ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        series_default: seriesDefault,
        rir_default: rirDefault,
        repeticiones_default: repeticionesDefault,
        tipo,
        musculo_principal: musculoPrincipal,
        modo_serie: modoSerie,
        ayuda_alumno: ayudaAlumno,
      };

      if (ejercicio) {
        const res = await fetch(`/api/staff/ejercicios/${ejercicio.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Error al guardar');
        }
      } else {
        const res = await fetch('/api/staff/ejercicios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Error al crear');
        }
      }

      router.push('/dashboard/ejercicios');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del ejercicio</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
            placeholder="Ej: Sentadilla"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Series default
            </label>
            <input
              type="number"
              min={1}
              value={seriesDefault}
              onChange={(e) => setSeriesDefault(Number(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RIR default
            </label>
            <input
              type="number"
              min={0}
              value={rirDefault}
              onChange={(e) => setRirDefault(Number(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {modoSerie === 'serie_x_minutos' ? 'Minutos default' : 'Repeticiones default'}
          </label>
          <input
            type="number"
            min={1}
            value={repeticionesDefault}
            onChange={(e) => setRepeticionesDefault(Number(e.target.value) || 1)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de ejercicio</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as 'empuje' | 'traccion')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Músculo principal</label>
          <select
            value={musculoPrincipal}
            onChange={(e) => setMusculoPrincipal(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
          >
            {MUSCULOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modo de serie</label>
          <select
            value={modoSerie}
            onChange={(e) =>
              setModoSerie(e.target.value as EjercicioPlantilla['modo_serie'])
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
          >
            {MODOS_SERIE.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ayuda al alumno
          </label>
          <textarea
            value={ayudaAlumno}
            onChange={(e) => setAyudaAlumno(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
            placeholder="Tips, instrucciones o indicaciones para el alumno..."
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-sanmartin-red text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition"
        >
          {loading ? 'Guardando...' : ejercicio ? 'Actualizar ejercicio' : 'Crear ejercicio'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        {ejercicio && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm('¿Eliminar este ejercicio del catálogo?')) return;
              try {
                const res = await fetch(`/api/staff/ejercicios/${ejercicio.id}`, {
                  method: 'DELETE',
                });
                if (res.ok) {
                  router.push('/dashboard/ejercicios');
                  router.refresh();
                } else {
                  const data = await res.json().catch(() => ({}));
                  setError(data.error || 'Error al eliminar');
                }
              } catch {
                setError('Error al eliminar');
              }
            }}
            className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition"
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
