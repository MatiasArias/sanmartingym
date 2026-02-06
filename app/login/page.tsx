'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni }),
      });

      if (!res.ok) {
        throw new Error('DNI no encontrado');
      }

      const data = await res.json();
      
      if (data.usuario.rol === 'jugador') {
        router.push('/home');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('DNI no encontrado o inactivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sanmartin-black via-gray-900 to-sanmartin-red flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 relative">
              <Image
                src="/logo.png"
                alt="San Martín"
                width={128}
                height={128}
                priority
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-sanmartin-black mb-2">
            San Martín Gym
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Sistema de Entrenamiento
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
                DNI
              </label>
              <input
                type="text"
                id="dni"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ingresá tu DNI"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent transition"
                required
                minLength={7}
                maxLength={8}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sanmartin-red hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
