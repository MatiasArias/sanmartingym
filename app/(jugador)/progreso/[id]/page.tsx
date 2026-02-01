import { getTokenPayload } from '@/lib/auth';
import { getHistorialEjercicio, redis, type Ejercicio } from '@/lib/redis';
import { ArrowLeft, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function HistorialEjercicioPage({ params }: { params: { id: string } }) {
  const payload = await getTokenPayload();
  const ejercicio = (await redis.get(`ejercicio:${params.id}`)) as Ejercicio | null;
  const historial = await getHistorialEjercicio(payload!.id as string, params.id);

  if (!ejercicio) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Ejercicio no encontrado</p>
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const pesoMaximo = Math.max(...historial.map(r => r.peso));
  const repsMaximas = Math.max(...historial.map(r => r.reps));
  const totalSeries = historial.length;

  // Agrupar por fecha
  const porFecha = historial.reduce((acc, reg) => {
    if (!acc[reg.fecha]) acc[reg.fecha] = [];
    acc[reg.fecha].push(reg);
    return acc;
  }, {} as Record<string, typeof historial>);

  return (
    <div className="p-4 space-y-4">
      <Link
        href="/progreso"
        className="inline-flex items-center gap-2 text-sanmartin-red hover:underline"
      >
        <ArrowLeft size={20} />
        Volver
      </Link>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{ejercicio.nombre}</h1>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-sanmartin-red">{pesoMaximo}kg</div>
            <div className="text-xs text-gray-600">Peso máx</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sanmartin-red">{repsMaximas}</div>
            <div className="text-xs text-gray-600">Reps máx</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sanmartin-red">{totalSeries}</div>
            <div className="text-xs text-gray-600">Total series</div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Calendar size={20} />
        Historial
      </h2>

      <div className="space-y-3">
        {Object.entries(porFecha).map(([fecha, registros]) => (
          <div key={fecha} className="bg-white rounded-xl shadow-md p-5">
            <div className="font-semibold text-gray-900 mb-3">
              {new Date(fecha).toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </div>
            <div className="space-y-2">
              {registros.map((reg, idx) => (
                <div key={reg.id} className="flex items-center gap-3 text-sm">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono text-xs">
                    Serie {reg.serie_num}
                  </span>
                  <span className="font-semibold text-gray-900">{reg.peso}kg</span>
                  <span className="text-gray-600">× {reg.reps} reps</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
