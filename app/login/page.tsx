'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { DNI_MIN_LENGTH, DNI_MAX_LENGTH } from '@/lib/constants';

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

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'DNI no encontrado o inactivo');
        return;
      }

      if (data.usuario?.rol === 'jugador') {
        router.push('/home');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
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
            <Input
              label="DNI"
              id="dni"
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingresá tu DNI"
              required
              minLength={DNI_MIN_LENGTH}
              maxLength={DNI_MAX_LENGTH}
            />

            <ErrorMessage message={error} />

            <Button type="submit" disabled={loading} className="w-full py-3">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
