import { getAllPlantillasEjercicio } from '@/lib/redis';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import type { EjercicioPlantilla } from '@/lib/redis';

const TIPO_LABEL: Record<string, string> = {
  empuje: 'Empuje',
  traccion: 'Tracción',
};

const MODO_LABEL: Record<string, string> = {
  serie_x_repeticion: 'Series × Repetición',
  serie_x_minutos: 'Series × Minutos',
  serie_x_brazo: 'Series × Brazo',
};

export default async function EjerciciosPage() {
  const ejercicios = await getAllPlantillasEjercicio();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ejercicios</h1>
          <p className="text-gray-600">Catálogo de ejercicios para usar en rutinas</p>
        </div>
        <Link
          href="/dashboard/ejercicios/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sanmartin-red text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          <Plus size={20} />
          Nuevo ejercicio
        </Link>
      </div>

      {ejercicios.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-500 mb-4">No hay ejercicios en el catálogo</p>
          <Link
            href="/dashboard/ejercicios/nuevo"
            className="inline-flex items-center gap-2 text-sanmartin-red hover:underline"
          >
            Crear el primer ejercicio
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ejercicios.map((ej: EjercicioPlantilla) => (
            <Link
              key={ej.id}
              href={`/dashboard/ejercicios/${ej.id}/editar`}
              className="block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1">{ej.nombre}</h3>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {TIPO_LABEL[ej.tipo] ?? ej.tipo}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {ej.musculo_principal}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {MODO_LABEL[ej.modo_serie] ?? ej.modo_serie}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {ej.series_default} series × {ej.repeticiones_default}
                    {ej.modo_serie === 'serie_x_minutos' ? ' min' : ' reps'}
                    {' '}• RIR {ej.rir_default}
                  </p>
                </div>
                <Pencil size={18} className="text-gray-400 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
