import { redis, getEjerciciosByRutina, getDiasDeRutina, type Rutina } from '@/lib/redis';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function RutinaDetailPage({ params }: { params: { id: string } }) {
  const rutina = (await redis.get(`rutina:${params.id}`)) as Rutina | null;
  const ejercicios = await getEjerciciosByRutina(params.id);
  const dias = await getDiasDeRutina(params.id);

  if (!rutina) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Rutina no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Link
        href="/dashboard/rutinas"
        className="inline-flex items-center gap-2 text-sanmartin-red hover:underline"
      >
        <ArrowLeft size={20} />
        Volver
      </Link>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{rutina.nombre}</h1>
        <p className="text-sm text-gray-600">{rutina.fecha_inicio} - {rutina.fecha_fin}</p>
      </div>

      {dias.map(dia => {
        const ejerciciosDia = ejercicios.filter(e => e.dia.toLowerCase() === dia.toLowerCase()).sort((a, b) => a.orden - b.orden);

        return (
          <div key={dia} className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 capitalize">{dia}</h2>
            
            {ejerciciosDia.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay ejercicios para este día</p>
            ) : (
              <div className="space-y-3">
                {ejerciciosDia.map((ej, idx) => (
                  <div key={ej.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{ej.nombre}</h3>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>{ej.series} series</span>
                          <span>•</span>
                          <span>{ej.repeticiones} reps</span>
                          <span>•</span>
                          <span>RIR {ej.rir}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
