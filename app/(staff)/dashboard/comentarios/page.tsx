import { getTokenPayload } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getComentariosResueltos } from '@/lib/redis';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, History } from 'lucide-react';

export default async function ComentariosHistorialPage() {
  const payload = await getTokenPayload();
  if (!payload || payload.rol !== 'staff') redirect('/login');

  const comentariosResueltos = await getComentariosResueltos();

  return (
    <div className="p-4 space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sanmartin-red hover:underline"
      >
        <ArrowLeft size={20} />
        Volver al inicio
      </Link>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="text-sanmartin-red" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">Histórico de comentarios</h1>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Comentarios resueltos por el staff. Los jugadores los enviaron desde su rutina.
        </p>

        {comentariosResueltos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay comentarios en el histórico</p>
            <p className="text-sm text-gray-400 mt-1">
              Los comentarios resueltos desde la sección de rutinas aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comentariosResueltos.map((c) => (
              <div
                key={c.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
              >
                <p className="text-gray-800 font-medium">{c.texto}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                  <span className="bg-gray-200 px-2 py-0.5 rounded">{c.ejercicio_nombre}</span>
                  <span>•</span>
                  <span>{c.anonimo ? 'Anónimo' : c.usuario_nombre ?? 'Jugador'}</span>
                  <span>•</span>
                  <span>
                    Enviado: {new Date(c.timestamp).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>•</span>
                  <span className="text-green-600">
                    Resuelto: {new Date(c.resuelto_at!).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
