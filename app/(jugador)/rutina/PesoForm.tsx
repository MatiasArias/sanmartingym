'use client';

import { useState } from 'react';
import { Plus, Save } from 'lucide-react';

interface PesoFormProps {
  ejercicioId: string;
  series: number;
}

interface Serie {
  peso: string;
  reps: string;
}

export default function PesoForm({ ejercicioId, series: totalSeries }: PesoFormProps) {
  const [seriesData, setSeriesData] = useState<Serie[]>([{ peso: '', reps: '' }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const agregarSerie = () => {
    if (seriesData.length < totalSeries) {
      setSeriesData([...seriesData, { peso: '', reps: '' }]);
    }
  };

  const actualizarSerie = (index: number, field: 'peso' | 'reps', value: string) => {
    const nuevasSeries = [...seriesData];
    nuevasSeries[index][field] = value;
    setSeriesData(nuevasSeries);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Guardar cada serie
      for (let i = 0; i < seriesData.length; i++) {
        const serie = seriesData[i];
        if (serie.peso && serie.reps) {
          await fetch('/api/registros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ejercicio_id: ejercicioId,
              peso: parseFloat(serie.peso),
              reps: parseInt(serie.reps),
              serie_num: i + 1,
            }),
          });
        }
      }

      // Marcar asistencia automáticamente
      await fetch('/api/asistencia', {
        method: 'POST',
      });

      setMessage('✅ Guardado y asistencia marcada');
      setSeriesData([{ peso: '', reps: '' }]);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Registrar series ({seriesData.length}/{totalSeries})
      </div>
      
      {seriesData.map((serie, index) => (
        <div key={index} className="flex gap-2 items-center">
          <span className="text-sm font-medium text-gray-500 w-12">#{index + 1}</span>
          <input
            type="number"
            placeholder="KG"
            value={serie.peso}
            onChange={(e) => actualizarSerie(index, 'peso', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
            step="0.5"
          />
          <input
            type="number"
            placeholder="REPS"
            value={serie.reps}
            onChange={(e) => actualizarSerie(index, 'reps', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
          />
        </div>
      ))}

      <div className="flex gap-2">
        {seriesData.length < totalSeries && (
          <button
            onClick={agregarSerie}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition"
          >
            <Plus size={18} />
            <span>Serie</span>
          </button>
        )}
        
        <button
          onClick={handleSubmit}
          disabled={loading || seriesData.every(s => !s.peso || !s.reps)}
          className="flex-1 flex items-center justify-center gap-2 bg-sanmartin-red hover:bg-red-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          <span>{loading ? 'Guardando...' : 'Guardar'}</span>
        </button>
      </div>

      {message && (
        <div className={`text-sm text-center py-2 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
