'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

interface AgregarComentarioFormProps {
  ejercicioId: string;
  ejercicioNombre: string;
}

export default function AgregarComentarioForm({ ejercicioId, ejercicioNombre }: AgregarComentarioFormProps) {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [anonimo, setAnonimo] = useState(true);
  const [nombreJugador, setNombreJugador] = useState('');
  const [sending, setSending] = useState(false);
  const [expandido, setExpandido] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const txt = texto.trim();
    if (!txt || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/comentarios-ejercicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ejercicio_id: ejercicioId,
          texto: txt,
          anonimo,
          usuario_nombre: !anonimo ? nombreJugador.trim() || undefined : undefined,
        }),
      });
      if (res.ok) {
        setTexto('');
        setNombreJugador('');
        setExpandido(false);
        router.refresh();
      }
    } finally {
      setSending(false);
    }
  }

  if (!expandido) {
    return (
      <button
        type="button"
        onClick={() => setExpandido(true)}
        className="text-sm text-sanmartin-red hover:underline mt-1"
      >
        + Agregar comentario
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 pt-2 border-t border-gray-100 space-y-2">
      <input
        type="text"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={`Registrar feedback sobre ${ejercicioNombre}...`}
        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
        maxLength={500}
        disabled={sending}
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={anonimo}
            onChange={(e) => setAnonimo(e.target.checked)}
            className="rounded border-gray-300 text-sanmartin-red focus:ring-sanmartin-red"
          />
          <span className="text-xs text-gray-600">Anónimo</span>
        </label>
        {!anonimo && (
          <input
            type="text"
            value={nombreJugador}
            onChange={(e) => setNombreJugador(e.target.value)}
            placeholder="Nombre del jugador"
            className="text-sm px-2 py-1 border border-gray-200 rounded w-40"
          />
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!texto.trim() || sending}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-sanmartin-red text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            <Send size={14} />
            Guardar
          </button>
          <button
            type="button"
            onClick={() => { setExpandido(false); setTexto(''); setNombreJugador(''); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
