'use client';

import { useState } from 'react';
import { Rutina, EjercicioConAyuda } from '@/lib/redis';
import DiaSelector from './DiaSelector';
import PesoForm from './PesoForm';
import EscalaRPE from './EscalaRPE';
import CuestionarioWellness from './CuestionarioWellness';
import { Heart, X } from 'lucide-react';

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
  const [showWellnessModal, setShowWellnessModal] = useState(false);

  return (
    <div className="p-4 space-y-4">
      {/* Botón para abrir cuestionario Wellness (opcional) o mostrar score si ya completó */}
      {wellnessScore == null ? (
        <button
          type="button"
          onClick={() => setShowWellnessModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition border border-gray-200"
        >
          <Heart className="text-sanmartin-red" size={20} />
          Completar cuestionario Wellness (opcional)
        </button>
      ) : (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          Wellness hoy: <strong className="text-sanmartin-red">{wellnessScore}/10</strong>
        </p>
      )}

      {/* Modal Wellness: solo visible cuando el usuario elige completarlo */}
      {showWellnessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowWellnessModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wellness-modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowWellnessModal(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>
            <div className="p-6 pt-10">
              <CuestionarioWellness onClose={() => setShowWellnessModal(false)} />
            </div>
          </div>
        </div>
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
              <PesoForm rutinaId={rutina.id} dia={diaActual} ejercicioId={ejercicio.id} series={ejercicio.series} repeticiones={ejercicio.repeticiones} rir={ejercicio.rir} />
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
