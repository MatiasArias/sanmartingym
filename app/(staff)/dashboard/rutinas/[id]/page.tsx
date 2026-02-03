import { getRutinaById, getEjerciciosByRutina, getDiasDeRutina, getComentariosByEjercicios } from '@/lib/redis';
import { ArrowLeft, Pencil, Trophy, Moon, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import AgregarComentarioForm from '../AgregarComentarioForm';

const diasOrden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;

export default async function RutinaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rutina = await getRutinaById(id);
  const ejercicios = await getEjerciciosByRutina(id);
  const dias = await getDiasDeRutina(id);
  const ejercicioIds = ejercicios.map((e) => e.id);
  const comentariosPorEjercicio = await getComentariosByEjercicios(ejercicioIds);

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

      <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{rutina.nombre}</h1>
          <p className="text-sm text-gray-600">
            {rutina.fecha_inicio} - {rutina.fecha_fin}
            {rutina.semanas && ` • ${rutina.semanas} semanas`}
          </p>
        </div>
        <Link
          href={`/dashboard/rutinas/${rutina.id}/editar`}
          className="inline-flex items-center gap-2 px-4 py-2 border border-sanmartin-red text-sanmartin-red rounded-lg hover:bg-red-50 transition font-medium"
        >
          <Pencil size={18} />
          Editar
        </Link>
      </div>

      {(rutina.dias_config
        ? diasOrden.filter((d) => rutina.dias_config![d])
        : dias.length > 0 ? dias : diasOrden
      ).map((dia) => {
        const tipo = rutina.dias_config?.[dia] ?? (ejercicios.some(e => e.dia === dia) ? 'ejercicio' : 'descanso');
        const ejerciciosDia = ejercicios.filter(e => e.dia.toLowerCase() === dia.toLowerCase()).sort((a, b) => a.orden - b.orden);

        return (
          <div key={dia} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-gray-900 capitalize">{dia}</h2>
              {tipo === 'partido' && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Partido</span>}
              {tipo === 'descanso' && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Descanso</span>}
            </div>
            
            {tipo === 'partido' && <p className="text-amber-700 text-sm flex items-center gap-2"><Trophy size={16} /> Día de partido</p>}
            {tipo === 'descanso' && <p className="text-gray-500 text-sm flex items-center gap-2"><Moon size={16} /> Día de descanso</p>}
            {tipo === 'ejercicio' && ejerciciosDia.length === 0 && (
              <p className="text-gray-500 text-sm">No hay ejercicios para este día</p>
            )}
            {tipo === 'ejercicio' && ejerciciosDia.length > 0 && (
              <div className="space-y-3">
                {ejerciciosDia.map((ej, idx) => {
                  const comentarios = comentariosPorEjercicio[ej.id] || [];
                  return (
                    <div key={ej.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">{ej.nombre}</h3>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>{ej.series} series</span>
                            <span>•</span>
                            <span>{ej.repeticiones} reps</span>
                            <span>•</span>
                            <span>RIR {ej.rir}</span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                                <MessageSquare size={14} className="text-sanmartin-red" />
                                <span className="font-medium">Comentarios ({comentarios.length})</span>
                              </div>
                              {comentarios.length > 0 && (
                                <div className="space-y-1.5 mb-2">
                                  {comentarios.map((c) => (
                                    <div key={c.id} className="text-sm bg-gray-50 rounded px-2 py-1.5 border border-gray-100">
                                      <p className="text-gray-800">{c.texto}</p>
                                      <p className="text-xs text-gray-400">
                                        {new Date(c.timestamp).toLocaleDateString('es-AR', {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}{' '}
                                        • {c.anonimo ? 'Anónimo' : (c.usuario_nombre ?? 'Jugador')}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <AgregarComentarioForm ejercicioId={ej.id} ejercicioNombre={ej.nombre} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
