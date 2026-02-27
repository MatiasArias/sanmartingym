import { BarChart3 } from 'lucide-react';
import EstadisticasJugadorClient from './EstadisticasJugadorClient';

export default function EstadisticasPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="text-sanmartin-red" size={28} />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-sm text-gray-500">
            Por semana o por mes: asistencia, wellness, RPE y evolución de peso
          </p>
        </div>
      </div>

      <EstadisticasJugadorClient />
    </div>
  );
}
