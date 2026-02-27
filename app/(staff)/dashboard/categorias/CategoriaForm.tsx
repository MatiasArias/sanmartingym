'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function CategoriaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/staff/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear categoría');
      }
      setNombre('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la categoría
        </label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: M15, M17, Primera, Femenino"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
          disabled={loading}
        />
      </div>
      <ErrorMessage message={error} />
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-4 py-2 bg-sanmartin-red text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Guardando...' : 'Agregar categoría'}
      </button>
    </form>
  );
}
