import { getTokenPayload } from '@/lib/auth';
import { getEjerciciosConRegistros } from '@/lib/redis';
import Link from 'next/link';
import { TrendingUp, Dumbbell } from 'lucide-react';

export default async function ProgresoPage() {
  const payload = await getTokenPayload();
  const ejerciciosConRegistros = await getEjerciciosConRegistros(payload!.id as string);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="text-sanmartin-red" size={28} />
          <h1 className="text-2xl font-bold text-gray-900">Mi Progreso</h1>
        </div>
        <p className="text-gray-600">Historial de ejercicios completados</p>
      </div>

      {ejerciciosConRegistros.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Dumbbell className="mx-auto text-yellow-600 mb-2" size={32} />
          <p className="text-yellow-800">Aún no registraste ningún ejercicio</p>
          <p className="text-sm text-yellow-600 mt-2">Comenzá tu rutina para ver tu progreso</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ejerciciosConRegistros.map(({ ejercicio, ultimoRegistro }) => (
            <Link
              key={ejercicio.id}
              href={`/progreso/${ejercicio.id}`}
              className="block bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900">{ejercicio.nombre}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {ejercicio.dia}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Último: {ultimoRegistro.peso}kg × {ultimoRegistro.reps} reps</span>
                <span className="text-gray-400">
                  {new Date(ultimoRegistro.fecha).toLocaleDateString('es-AR')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
