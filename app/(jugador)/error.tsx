'use client';

import Link from 'next/link';

export default function JugadorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 pb-24">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Algo salió mal</h2>
        <p className="text-gray-600 text-sm mb-6">{error.message || 'Error inesperado'}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 bg-sanmartin-red text-white rounded-lg font-medium hover:bg-red-700 transition"
          >
            Reintentar
          </button>
          <Link
            href="/home"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
