'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface JugadorActivoToggleProps {
  jugadorId: string;
  activo: boolean;
}

export default function JugadorActivoToggle({ jugadorId, activo }: JugadorActivoToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/jugadores/${jugadorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Error al actualizar');
        return;
      }
      router.refresh();
    } catch {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
        activo
          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
      } disabled:opacity-50`}
      title={activo ? 'Marcar como inactivo' : 'Marcar como activo'}
    >
      {loading ? '…' : activo ? 'Activo' : 'Inactivo'}
    </button>
  );
}
