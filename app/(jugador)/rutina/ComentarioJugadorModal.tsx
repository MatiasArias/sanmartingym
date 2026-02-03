'use client';

import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

interface ComentarioJugadorModalProps {
  ejercicioId: string;
  ejercicioNombre: string;
  onClose: () => void;
}

export default function ComentarioJugadorModal({ ejercicioId, ejercicioNombre, onClose }: ComentarioJugadorModalProps) {
  const [texto, setTexto] = useState('');
  const [anonimo, setAnonimo] = useState(true);
  const [sending, setSending] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const txt = texto.trim();
    if (!txt || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/comentarios-ejercicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ejercicio_id: ejercicioId, texto: txt, anonimo }),
      });
      if (res.ok) {
        setEnviado(true);
        setTexto('');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comentario-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>
        <div className="p-6 pt-10">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={24} className="text-sanmartin-red" />
            <h2 id="comentario-modal-title" className="text-lg font-bold text-gray-900">
              Comentario sobre {ejercicioNombre}
            </h2>
          </div>
          {enviado ? (
            <div className="text-center py-6">
              <p className="text-green-600 font-medium">✓ Comentario enviado</p>
              <p className="text-sm text-gray-500 mt-1">El staff lo revisará. Gracias por tu feedback.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-sanmartin-red text-white rounded-lg hover:bg-red-700"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Enviá feedback sobre este ejercicio (ej: molestias, dolor). Solo el staff puede verlo.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Ej: Este ejercicio me hace doler la espalda"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent min-h-[80px]"
                  maxLength={500}
                  disabled={sending}
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={anonimo}
                    onChange={(e) => setAnonimo(e.target.checked)}
                    className="rounded border-gray-300 text-sanmartin-red focus:ring-sanmartin-red"
                  />
                  <span className="text-sm text-gray-700">Enviar como anónimo</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!texto.trim() || sending}
                    className="flex items-center gap-2 px-4 py-2 bg-sanmartin-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                    Enviar
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
