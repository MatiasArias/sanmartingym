'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Categoria } from '@/lib/redis';

interface JugadorFormProps {
  categorias: Categoria[];
}

export default function JugadorForm({ categorias }: JugadorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!dni.trim() || !nombre.trim() || !fechaNacimiento || !categoriaId) {
      setError('Completá todos los campos');
      return;
    }

    const dniLimpio = dni.replace(/\D/g, '');
    if (dniLimpio.length < 7 || dniLimpio.length > 8) {
      setError('DNI debe tener 7 u 8 dígitos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/staff/jugadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: dniLimpio,
          nombre: nombre.trim(),
          fecha_nacimiento: fechaNacimiento,
          categoria_id: categoriaId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar');
      }

      setSuccess(true);
      setDni('');
      setNombre('');
      setFechaNacimiento('');
      setCategoriaId(categorias[0]?.id ?? '');
      router.refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">Jugador cargado correctamente. Ya puede ingresar con su DNI.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DNI (para ingreso)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Ej: 45123456"
            maxLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Ej: Juan Pérez"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-sanmartin-red text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition"
      >
        {loading ? 'Guardando...' : 'Cargar jugador'}
      </button>
    </form>
  );
}
