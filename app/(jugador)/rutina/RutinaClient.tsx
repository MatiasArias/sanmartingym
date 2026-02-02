'use client';

import { Rutina, EjercicioConAyuda } from '@/lib/redis';
import DiaSelector from './DiaSelector';
import PesoForm from './PesoForm';
import EscalaRPE from './EscalaRPE';
import CuestionarioWellness from './CuestionarioWellness';

interface RutinaClientProps {
  rutina: Rutina;
  ejercicios: EjercicioConAyuda[];
  dias: string[];
  diaActual: string;
  semanaActual?: number;
  sugerenciasPeso?: Record<string, number>;
  /** null = no completó hoy (mostrar cuestionario opcional); number = score del día */
  wellnessScore?: number | null;
  wellnessBajo?: boolean;
}

export default function RutinaClient({ rutina, ejercicios, dias, diaActual, semanaActual, sugerenciasPeso = {}, wellnessScore = null, wellnessBajo = false }: RutinaClientProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Cuestionario Wellness opcional: arriba del encabezado de la rutina */}
      {wellnessScore == null ? (
        <CuestionarioWellness />
      ) : (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          Wellness hoy: <strong className="text-sanmartin-red">{wellnessScore}/10</strong>
        </p>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{rutina.nombre}</h1>
        <p className="text-sm text-gray-600">
          {rutina.fecha_inicio} - {rutina.fecha_fin}
          {semanaActual != null && (
            <span className="ml-2 font-medium text-sanmartin-red">Semana {semanaActual}</span>
          )}
        </p>
        {wellnessBajo && (
          <p className="text-sm text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Rutina adaptada: hoy tenés menos series/repeticiones según tu cuestionario wellness para que te recuperes mejor.
          </p>
        )}
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
              <div className="flex gap-4 text-sm text-gray-600 mb-4 flex-wrap">
                <span className="font-medium">{ejercicio.series} series</span>
                <span>•</span>
                <span>{ejercicio.repeticiones} reps</span>
                <span>•</span>
                <span>RIR {ejercicio.rir}</span>
                {sugerenciasPeso[ejercicio.id] != null && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-sanmartin-red">
                      Peso sugerido: ~{sugerenciasPeso[ejercicio.id]} kg
                    </span>
                  </>
                )}
              </div>
              {ejercicio.ayuda_alumno && (
                <p className="text-sm text-gray-500 mb-2 italic border-l-2 border-sanmartin-red pl-3">
                  💡 {ejercicio.ayuda_alumno}
                </p>
              )}
              {ejercicio.nota_semana && (
                <p className="text-sm text-gray-600 mb-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  📝 {ejercicio.nota_semana}
                </p>
              )}
              <PesoForm ejercicioId={ejercicio.id} series={ejercicio.series} />
            </div>
          ))
        )}
      </div>

      {/* Escala RPE al final de la rutina */}
      {ejercicios.length > 0 && (
        <div className="mt-6">
          <EscalaRPE rutinaId={rutina.id} dia={diaActual} />
        </div>
      )}
    </div>
  );
}
