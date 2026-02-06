'use client';

import { useState, useMemo } from 'react';
import { Rutina, EjercicioConAyuda } from '@/lib/redis';
import DiaSelector from './DiaSelector';
import PesoForm from './PesoForm';
import EscalaRPE from './EscalaRPE';
import CuestionarioWellness from './CuestionarioWellness';
import ComentarioJugadorModal from './ComentarioJugadorModal';
import { Heart, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import MovilidadReady from './MovilidadReady';

/** Agrupa ejercicios por circuito_nombre preservando el orden del día */
function agruparPorCircuito(ejercicios: EjercicioConAyuda[]): { nombre: string; ejercicios: EjercicioConAyuda[] }[] {
  const grupos: { nombre: string; ejercicios: EjercicioConAyuda[] }[] = [];
  for (const ej of ejercicios) {
    const nombre = (ej.circuito_nombre ?? '').trim();
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.nombre === nombre) {
      ultimo.ejercicios.push(ej);
    } else {
      grupos.push({ nombre, ejercicios: [ej] });
    }
  }
  return grupos;
}

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
  const [comentarioEjercicioId, setComentarioEjercicioId] = useState<string | null>(null);
  const [wellnessExpandido, setWellnessExpandido] = useState(true);
  const [wellnessOmitido, setWellnessOmitido] = useState(false);
  const gruposCircuito = useMemo(() => agruparPorCircuito(ejercicios), [ejercicios]);

  return (
    <div className="p-4 space-y-4">
      {/* Cuestionario wellness (opcional): si no completó, mostrar con opción de omitir */}
      {wellnessScore == null && !wellnessOmitido && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => setWellnessExpandido((v) => !v)}
            className="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-gray-50 transition"
          >
            <span className="font-bold text-gray-900 flex items-center gap-2">
              <Heart className="text-sanmartin-red" size={20} />
              Cuestionario wellness (opcional)
            </span>
            {wellnessExpandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {wellnessExpandido && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
              <p className="text-sm text-gray-600">
                Contanos cómo te sentís para que la rutina se adapte a tu recuperación. Podés omitirlo y ver la rutina completa.
              </p>
              <CuestionarioWellness onClose={() => setWellnessExpandido(false)} />
              <button
                type="button"
                onClick={() => setWellnessOmitido(true)}
                className="w-full py-2.5 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
              >
                Omitir y ver rutina
              </button>
            </div>
          )}
        </div>
      )}

      {/* Score wellness del día (0-25) - solo si completó */}
      {wellnessScore != null && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          Wellness hoy: <strong className="text-sanmartin-red">{wellnessScore}/25</strong>
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
          gruposCircuito.map((grupo, grupoIdx) => (
            <div key={grupoIdx} className="space-y-4">
              {grupo.nombre && (
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">
                  {grupo.nombre}
                </h2>
              )}
              {grupo.ejercicios.map((ejercicio) => {
                const esMovilidad = ejercicio.tipo_plantilla === 'movilidad';
                return (
                  <div key={ejercicio.id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{ejercicio.nombre}</h3>
                        {esMovilidad && (
                          <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Movilidad / Activación
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setComentarioEjercicioId(ejercicio.id)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sanmartin-red bg-red-50 border border-red-200 hover:bg-red-100 transition font-medium"
                        aria-label="Dejar comentario sobre este ejercicio"
                      >
                        <MessageSquare size={18} />
                        <span className="text-sm">Comentario</span>
                      </button>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mb-4 flex-wrap">
                      <span className="font-medium">{ejercicio.series} series</span>
                      <span>•</span>
                      <span>{ejercicio.repeticiones} reps</span>
                      <span>•</span>
                      <span>RIR {ejercicio.rir}</span>
                      {!esMovilidad && sugerenciasPeso[ejercicio.id] != null && (
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
                    {esMovilidad ? (
                      <MovilidadReady rutinaId={rutina.id} dia={diaActual} ejercicioId={ejercicio.id} />
                    ) : (
                      <PesoForm
                        rutinaId={rutina.id}
                        dia={diaActual}
                        ejercicioId={ejercicio.id}
                        series={ejercicio.series}
                        repeticiones={ejercicio.repeticiones}
                        rir={ejercicio.rir}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Modal comentario jugador */}
      {comentarioEjercicioId && (
        <ComentarioJugadorModal
          ejercicioId={comentarioEjercicioId}
          ejercicioNombre={ejercicios.find((e) => e.id === comentarioEjercicioId)?.nombre ?? 'Ejercicio'}
          onClose={() => setComentarioEjercicioId(null)}
        />
      )}

      {/* Escala RPE al final de la rutina */}
      {ejercicios.length > 0 && (
        <div className="mt-6">
          <EscalaRPE rutinaId={rutina.id} dia={diaActual} ejercicios={ejercicios.map((e) => ({ id: e.id, series: e.series }))} />
        </div>
      )}
    </div>
  );
}
