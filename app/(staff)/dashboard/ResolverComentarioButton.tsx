'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

interface ResolverComentarioButtonProps {
  comentarioId: string;
  ejercicioId: string;
  ejercicioNombre: string;
}

export default function ResolverComentarioButton({ comentarioId, ejercicioId, ejercicioNombre }: ResolverComentarioButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleResolver() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/comentarios-ejercicio/resolver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario_id: comentarioId, ejercicio_id: ejercicioId, ejercicio_nombre: ejercicioNombre }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleResolver}
      disabled={loading}
      className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50"
      title="Marcar como resuelto"
    >
      <Check size={14} />
      Resolver
    </button>
  );
}
