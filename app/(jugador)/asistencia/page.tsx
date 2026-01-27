'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function AsistenciaPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const marcarAsistencia = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/asistencia', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.message) {
        setMessage(data.message);
      } else {
        setMessage('✅ Asistencia marcada correctamente');
      }
    } catch (error) {
      setMessage('❌ Error al marcar asistencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-6 rounded-full">
            <CheckCircle className="text-green-600" size={48} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Asistencia</h1>
        <p className="text-gray-600 mb-6">
          {new Date().toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <button
          onClick={marcarAsistencia}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Marcando...' : 'Marcar Asistencia'}
        </button>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
            }`}
          >
            {message}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-6">
          💡 Tip: La asistencia también se marca automáticamente al registrar pesos en tu rutina
        </p>
      </div>
    </div>
  );
}
