'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Trophy, Moon, Dumbbell } from 'lucide-react';
import type { Rutina, Ejercicio, Categoria, EjercicioPlantilla, TipoDia } from '@/lib/redis';

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

interface ConfigSemana {
  series: number;
  repeticiones?: number;
  rir: number;
  nota?: string;
}

interface EjercicioEnDia {
  id?: string;
  ejercicio_plantilla_id: string;
  orden: number;
  config_por_semana: Record<number, ConfigSemana>;
}

/** Circuito: bloque con nombre que agrupa ejercicios en un día */
interface CircuitoEnDia {
  nombre: string;
  ejercicios: EjercicioEnDia[];
}

interface DiaConfig {
  tipo: TipoDia;
  /** Lista de circuitos (cada uno con nombre y ejercicios). Si está vacío o sin circuitos, se trata como un solo bloque sin nombre. */
  circuitos: CircuitoEnDia[];
}

interface RutinaFormProps {
  categorias: Categoria[];
  plantillas: EjercicioPlantilla[];
  rutina?: Rutina;
  ejercicios?: Ejercicio[];
}

function getPlantillaById(plantillas: EjercicioPlantilla[], id: string): EjercicioPlantilla | undefined {
  return plantillas.find((p) => p.id === id);
}

function buildConfigPorSemana(
  semanas: number,
  plantilla?: EjercicioPlantilla,
  existente?: Record<number, ConfigSemana>
): Record<number, ConfigSemana> {
  const result: Record<number, ConfigSemana> = {};
  for (let s = 1; s <= semanas; s++) {
    const base = existente?.[s] ?? {
      series: plantilla?.series_default ?? 3,
      repeticiones: plantilla?.repeticiones_default,
      rir: plantilla?.rir_default ?? 2,
    };
    result[s] = {
      ...base,
      repeticiones: base.repeticiones ?? plantilla?.repeticiones_default ?? 10,
      nota: base.nota ?? '',
    };
  }
  return result;
}

export default function RutinaForm({
  categorias,
  plantillas,
  rutina,
  ejercicios = [],
}: RutinaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddDia, setShowAddDia] = useState<number | null>(null);

  const semanasDefault = rutina?.semanas ?? 4;
  const [categoriaId, setCategoriaId] = useState(rutina?.categoria_id ?? categorias[0]?.id ?? '');
  const [nombre, setNombre] = useState(rutina?.nombre ?? '');
  const [fechaInicio, setFechaInicio] = useState(
    rutina?.fecha_inicio ?? new Date().toISOString().split('T')[0]
  );
  const [semanas, setSemanas] = useState(semanasDefault);

  const [diasConfig, setDiasConfig] = useState<Record<string, DiaConfig>>(() => {
    const inicial: Record<string, DiaConfig> = {};
    const ejerciciosPorDia = ejercicios
      .filter((e) => e.ejercicio_plantilla_id)
      .reduce<Record<string, Ejercicio[]>>((acc, e) => {
        if (!acc[e.dia]) acc[e.dia] = [];
        acc[e.dia].push(e);
        return acc;
      }, {});

    for (const dia of DIAS_SEMANA) {
      const ejDia = (ejerciciosPorDia[dia] ?? []).sort((a, b) => a.orden - b.orden);
      const tipoFromRutina = rutina?.dias_config?.[dia];
      // Agrupar por circuito_nombre preservando orden
      const circuitos: CircuitoEnDia[] = [];
      let currentCircuito: CircuitoEnDia | null = null;
      for (let i = 0; i < ejDia.length; i++) {
        const e = ejDia[i];
        const circuitoNombre = e.circuito_nombre?.trim() ?? '';
        const plant = e.ejercicio_plantilla_id
          ? plantillas.find((p) => p.id === e.ejercicio_plantilla_id)
          : undefined;
        const baseConfig = e.config_por_semana ?? {
          1: { series: e.series, repeticiones: e.repeticiones, rir: e.rir },
        };
        const ejEnDia: EjercicioEnDia = {
          id: e.id,
          ejercicio_plantilla_id: e.ejercicio_plantilla_id!,
          orden: i,
          config_por_semana: buildConfigPorSemana(semanasDefault, plant, baseConfig),
        };
        if (
          currentCircuito &&
          (currentCircuito.nombre === circuitoNombre || (!currentCircuito.nombre && !circuitoNombre))
        ) {
          currentCircuito.ejercicios.push(ejEnDia);
        } else {
          currentCircuito = { nombre: circuitoNombre, ejercicios: [ejEnDia] };
          circuitos.push(currentCircuito);
        }
      }
      if (circuitos.length === 0 && tipoFromRutina === 'ejercicio') {
        circuitos.push({ nombre: '', ejercicios: [] });
      }
      inicial[dia] = {
        tipo: tipoFromRutina ?? (ejDia.length > 0 ? 'ejercicio' : 'descanso'),
        circuitos: circuitos.length > 0 ? circuitos : [{ nombre: '', ejercicios: [] }],
      };
    }
    return inicial;
  });

  const setTipoDia = (dia: string, tipo: TipoDia) => {
    setDiasConfig((prev) => ({
      ...prev,
      [dia]: {
        tipo,
        circuitos: tipo === 'ejercicio' ? [{ nombre: '', ejercicios: [] }] : [],
      },
    }));
    setShowAddDia(null);
  };

  const addCircuito = (dia: string) => {
    setDiasConfig((prev) => {
      const diaActual = prev[dia] ?? { tipo: 'ejercicio', circuitos: [{ nombre: '', ejercicios: [] }] };
      return {
        ...prev,
        [dia]: {
          ...diaActual,
          tipo: 'ejercicio',
          circuitos: [...diaActual.circuitos, { nombre: '', ejercicios: [] }],
        },
      };
    });
  };

  const setCircuitoNombre = (dia: string, circuitIdx: number, nombre: string) => {
    setDiasConfig((prev) => {
      const diaActual = prev[dia];
      if (!diaActual) return prev;
      const circuitos = [...diaActual.circuitos];
      if (circuitos[circuitIdx] == null) return prev;
      circuitos[circuitIdx] = { ...circuitos[circuitIdx], nombre };
      return { ...prev, [dia]: { ...diaActual, circuitos } };
    });
  };

  const removeCircuito = (dia: string, circuitIdx: number) => {
    setDiasConfig((prev) => {
      const diaActual = prev[dia];
      if (!diaActual) return prev;
      const circuitos = diaActual.circuitos.filter((_, i) => i !== circuitIdx);
      return {
        ...prev,
        [dia]: { ...diaActual, circuitos: circuitos.length > 0 ? circuitos : [{ nombre: '', ejercicios: [] }] },
      };
    });
  };

  const addEjercicioACircuito = (dia: string, circuitIdx: number, plantillaId: string) => {
    const plantilla = getPlantillaById(plantillas, plantillaId);
    if (!plantilla) return;

    const config = buildConfigPorSemana(semanas, plantilla);
    setDiasConfig((prev) => {
      const diaActual = prev[dia] ?? { tipo: 'ejercicio', circuitos: [{ nombre: '', ejercicios: [] }] };
      const circuitos = [...diaActual.circuitos];
      const circ = circuitos[circuitIdx];
      if (!circ) return prev;
      const orden = circ.ejercicios.length;
      circuitos[circuitIdx] = {
        ...circ,
        ejercicios: [...circ.ejercicios, { ejercicio_plantilla_id: plantillaId, orden, config_por_semana: config }],
      };
      return { ...prev, [dia]: { ...diaActual, circuitos } };
    });
    setShowAddDia(null);
  };

  const removeEjercicioDeCircuito = (dia: string, circuitIdx: number, ejIdx: number) => {
    setDiasConfig((prev) => {
      const diaActual = prev[dia];
      if (!diaActual) return prev;
      const circuitos = [...diaActual.circuitos];
      const circ = circuitos[circuitIdx];
      if (!circ) return prev;
      const ejercicios = circ.ejercicios.filter((_, i) => i !== ejIdx).map((e, i) => ({ ...e, orden: i }));
      circuitos[circuitIdx] = { ...circ, ejercicios };
      return { ...prev, [dia]: { ...diaActual, circuitos } };
    });
  };

  const updateConfigSemana = (
    dia: string,
    circuitIdx: number,
    ejIdx: number,
    semana: number,
    field: 'series' | 'repeticiones' | 'rir' | 'nota',
    value: number | string
  ) => {
    setDiasConfig((prev) => {
      const diaActual = prev[dia];
      if (!diaActual) return prev;
      const circ = diaActual.circuitos[circuitIdx];
      if (!circ) return prev;
      const ej = circ.ejercicios[ejIdx];
      if (!ej) return prev;
      const plantilla = getPlantillaById(plantillas, ej.ejercicio_plantilla_id);
      const config = { ...ej.config_por_semana };
      const actual = config[semana] ?? {
        series: plantilla?.series_default ?? 3,
        repeticiones: plantilla?.repeticiones_default ?? 10,
        rir: plantilla?.rir_default ?? 2,
        nota: '',
      };
      config[semana] = { ...actual, [field]: value };
      const ejercicios = [...circ.ejercicios];
      ejercicios[ejIdx] = { ...ej, config_por_semana: config };
      const circuitos = [...diaActual.circuitos];
      circuitos[circuitIdx] = { ...circ, ejercicios };
      return { ...prev, [dia]: { ...diaActual, circuitos } };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (semanas < 1) {
      setError('La rutina debe durar al menos 1 semana');
      return;
    }

    const dias_config: Record<string, TipoDia> = {};
    const ejerciciosPayload: Array<{
      id?: string;
      ejercicio_plantilla_id: string;
      dia: string;
      orden: number;
      circuito_nombre?: string;
      config_por_semana: Record<number, ConfigSemana>;
    }> = [];

    for (const dia of DIAS_SEMANA) {
      const dc = diasConfig[dia];
      const tipo = dc?.tipo ?? 'descanso';
      dias_config[dia] = tipo;

      if (tipo === 'ejercicio' && dc?.circuitos) {
        let ordenGlobal = 0;
        for (const circuito of dc.circuitos) {
          for (let i = 0; i < circuito.ejercicios.length; i++) {
            const ej = circuito.ejercicios[i];
            const plantilla = getPlantillaById(plantillas, ej.ejercicio_plantilla_id);
            const configCompleto = buildConfigPorSemana(semanas, plantilla, ej.config_por_semana);
            ejerciciosPayload.push({
              id: ej.id,
              ejercicio_plantilla_id: ej.ejercicio_plantilla_id,
              dia,
              orden: ordenGlobal++,
              circuito_nombre: circuito.nombre?.trim() || undefined,
              config_por_semana: configCompleto,
            });
          }
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        categoria_id: categoriaId,
        nombre: nombre.trim(),
        fecha_inicio: fechaInicio,
        semanas,
        dias_config,
        ejercicios: ejerciciosPayload,
      };

      if (rutina) {
        const res = await fetch(`/api/staff/rutinas/${rutina.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Error al guardar');
        }
        router.push(`/dashboard/rutinas/${rutina.id}`);
      } else {
        const res = await fetch('/api/staff/rutinas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Error al crear');
        }
        const { rutina: nueva } = await res.json();
        router.push(`/dashboard/rutinas/${nueva.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setLoading(false);
    }
  };

  const TIPO_OPCIONES: { tipo: TipoDia; icon: React.ReactNode; label: string }[] = [
    { tipo: 'partido', icon: <Trophy size={20} />, label: 'Día de partido' },
    { tipo: 'descanso', icon: <Moon size={20} />, label: 'Día de descanso' },
    { tipo: 'ejercicio', icon: <Dumbbell size={20} />, label: 'Día de ejercicio' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Datos básicos */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Datos de la rutina</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Ej: Fuerza - Pre-temporada"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semanas de duración</label>
            <input
              type="number"
              min={1}
              max={52}
              value={semanas}
              onChange={(e) => setSemanas(Math.max(1, Number(e.target.value) || 1))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Configuración por día</h2>
        <p className="text-sm text-gray-600 mb-4">
          Definí qué tipo de día es cada uno (lunes a sábado). Luego agregá ejercicios a los días de entrenamiento.
        </p>

        <div className="space-y-4">
          {DIAS_SEMANA.map((dia) => {
            const dc = diasConfig[dia] ?? { tipo: 'descanso', ejercicios: [] };
            const mostrarOpciones = showAddDia === DIAS_SEMANA.indexOf(dia);

            return (
              <div
                key={dia}
                className="border border-gray-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 capitalize">{dia}</h3>
                  {dc.tipo === 'descanso' && !mostrarOpciones && (
                    <button
                      type="button"
                      onClick={() => setShowAddDia(DIAS_SEMANA.indexOf(dia))}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Plus size={16} />
                      Configurar
                    </button>
                  )}
                  {dc.tipo !== 'descanso' && !mostrarOpciones && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        dc.tipo === 'partido' ? 'bg-amber-100 text-amber-800' :
                        dc.tipo === 'ejercicio' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                      }`}>
                        {dc.tipo === 'partido' && 'Partido'}
                        {dc.tipo === 'ejercicio' && 'Ejercicio'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddDia(DIAS_SEMANA.indexOf(dia))}
                        className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>

                {mostrarOpciones && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                    {TIPO_OPCIONES.map((opt) => (
                      <button
                        key={opt.tipo}
                        type="button"
                        onClick={() => setTipoDia(dia, opt.tipo)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-sanmartin-red hover:bg-red-50 transition"
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowAddDia(null)}
                      className="px-3 py-1 text-gray-500 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {dc.tipo === 'partido' && !mostrarOpciones && (
                  <p className="text-sm text-amber-700">Día de partido - sin entrenamiento</p>
                )}

                {dc.tipo === 'ejercicio' && (
                  <div className="space-y-4">
                    {(dc.circuitos ?? [{ nombre: '', ejercicios: [] }]).map((circuito, circuitIdx) => (
                      <div key={circuitIdx} className="border border-gray-300 rounded-xl p-4 bg-gray-50/80 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="text"
                            value={circuito.nombre}
                            onChange={(e) => setCircuitoNombre(dia, circuitIdx, e.target.value)}
                            placeholder="Nombre del circuito (ej: Fuerza 1)"
                            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg font-medium text-gray-900 bg-white"
                          />
                          {dc.circuitos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCircuito(dia, circuitIdx)}
                              className="text-red-600 hover:text-red-700 p-2 border border-red-200 rounded-lg hover:bg-red-50"
                              title="Quitar circuito"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        {circuito.ejercicios.map((ej, ejIdx) => {
                          const plantilla = getPlantillaById(plantillas, ej.ejercicio_plantilla_id);
                          return (
                            <div
                              key={ejIdx}
                              className="border border-gray-200 rounded-lg p-3 bg-white"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">
                                  {plantilla?.nombre ?? 'Ejercicio'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeEjercicioDeCircuito(dia, circuitIdx, ejIdx)}
                                  className="text-red-600 hover:text-red-700 p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {Array.from({ length: semanas }, (_, i) => i + 1).map((sem) => (
                                  <div key={sem} className="text-xs border border-gray-200 rounded-lg p-2 bg-gray-50">
                                    <span className="block text-gray-600 font-medium mb-2">Sem {sem}</span>
                                    <div className="space-y-1.5">
                                      <div>
                                        <label className="block text-gray-500 mb-0.5">Series</label>
                                        <input
                                          type="number"
                                          min={1}
                                          value={ej.config_por_semana[sem]?.series ?? plantilla?.series_default ?? 3}
                                          onChange={(e) =>
                                            updateConfigSemana(dia, circuitIdx, ejIdx, sem, 'series', Number(e.target.value) || 1)
                                          }
                                          className="w-full px-2 py-1 border rounded text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-gray-500 mb-0.5">Repeticiones</label>
                                        <input
                                          type="number"
                                          min={1}
                                          value={ej.config_por_semana[sem]?.repeticiones ?? plantilla?.repeticiones_default ?? 10}
                                          onChange={(e) =>
                                            updateConfigSemana(dia, circuitIdx, ejIdx, sem, 'repeticiones', Number(e.target.value) || 1)
                                          }
                                          className="w-full px-2 py-1 border rounded text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-gray-500 mb-0.5">RIR</label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={ej.config_por_semana[sem]?.rir ?? plantilla?.rir_default ?? 2}
                                          onChange={(e) =>
                                            updateConfigSemana(dia, circuitIdx, ejIdx, sem, 'rir', Number(e.target.value) || 0)
                                          }
                                          className="w-full px-2 py-1 border rounded text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-gray-500 mb-0.5">Nota (opcional)</label>
                                        <input
                                          type="text"
                                          value={ej.config_por_semana[sem]?.nota ?? ''}
                                          onChange={(e) =>
                                            updateConfigSemana(dia, circuitIdx, ejIdx, sem, 'nota', e.target.value)
                                          }
                                          placeholder="Ej: subir peso..."
                                          className="w-full px-2 py-1 border rounded text-sm"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {plantillas.length > 0 && (
                          <div className="flex gap-2">
                            <select
                              id={`add-${dia}-${circuitIdx}`}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                              <option value="">Agregar ejercicio a este circuito...</option>
                              {plantillas.map((p) => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const sel = document.getElementById(`add-${dia}-${circuitIdx}`) as HTMLSelectElement;
                                const val = sel?.value;
                                if (val) {
                                  addEjercicioACircuito(dia, circuitIdx, val);
                                  sel.value = '';
                                }
                              }}
                              className="px-4 py-2 bg-sanmartin-red text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => addCircuito(dia)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-sanmartin-red hover:bg-red-50 text-gray-700 text-sm font-medium"
                      >
                        <Plus size={18} />
                        Agregar circuito
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-sanmartin-red text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition"
        >
          {loading ? 'Guardando...' : rutina ? 'Actualizar rutina' : 'Crear rutina'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
