'use client';

import { Rutina, Ejercicio } from '@/lib/redis';
import DiaSelector from './DiaSelector';
import PesoForm from './PesoForm';

interface RutinaClientProps {
  rutina: Rutina;
  ejercicios: Ejercicio[];
  dias: string[];
  diaActual: string;
}

export default function RutinaClient({ rutina, ejercicios, dias, diaActual }: RutinaClientProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{rutina.nombre}</h1>
        <p className="text-sm text-gray-600">
          {rutina.fecha_inicio} - {rutina.fecha_fin}
        </p>
      </div>

      <DiaSelector dias={dias} diaActual={diaActual} />

      <div className="space-y-4">
        {ejercicios.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">No hay ejercicios para este día</p>
          </div>
        ) : (
          ejercicios.map((ejercicio) => (
            <div key={ejercicio.id} className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{ejercicio.nombre}</h3>
              <div className="flex gap-4 text-sm text-gray-600 mb-4">
                <span className="font-medium">{ejercicio.series} series</span>
                <span>•</span>
                <span>{ejercicio.repeticiones} reps</span>
                <span>•</span>
                <span>RIR {ejercicio.rir}</span>
              </div>
              <PesoForm ejercicioId={ejercicio.id} series={ejercicio.series} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
