'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Trophy, Moon, Dumbbell } from 'lucide-react';
import type { Rutina, Ejercicio, Categoria, EjercicioPlantilla, TipoDia } from '@/lib/redis';

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

interface ConfigSemana {
  series: number;
  rir: number;
  nota?: string;
}

interface EjercicioEnDia {
  id?: string;
  ejercicio_plantilla_id: string;
  orden: number;
  config_por_semana: Record<number, ConfigSemana>;
}

interface DiaConfig {
  tipo: TipoDia;
  ejercicios: EjercicioEnDia[];
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
      rir: plantilla?.rir_default ?? 2,
    };
    result[s] = { ...base, nota: base.nota ?? '' };
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
      const ejDia = ejerciciosPorDia[dia] ?? [];
      const tipoFromRutina = rutina?.dias_config?.[dia];
      inicial[dia] = {
        tipo: tipoFromRutina ?? (ejDia.length > 0 ? 'ejercicio' : 'descanso'),
        ejercicios: ejDia
          .sort((a, b) => a.orden - b.orden)
          .map((e, i) => {
            const plant = e.ejercicio_plantilla_id
              ? plantillas.find((p) => p.id === e.ejercicio_plantilla_id)
              : undefined;
            const baseConfig = e.config_por_semana ?? {
              1: { series: e.series, rir: e.rir },
            };
            return {
              id: e.id,
              ejercicio_plantilla_id: e.ejercicio_plantilla_id!,
              orden: i,
              config_por_semana: buildConfigPorSemana(semanasDefault, plant, baseConfig),
            };
          }),
      };
    }
    return inicial;
  });

  const setTipoDia = (dia: string, tipo: TipoDia) => {
    setDiasConfig((prev) => ({
      ...prev,
      [dia]: {
        tipo,
        ejercicios: tipo === 'ejercicio' ? prev[dia]?.ejercicios ?? [] : [],
      },
    }));
    setShowAddDia(null);
  };

  const addEjercicioADia = (dia: string, plantillaId: string) => {
    const plantilla = getPlantillaById(plantillas, plantillaId);
    if (!plantilla) return;

    const config = buildConfigPorSemana(semanas, plantilla);
    setDiasConfig((prev) => {
      const diaActual = prev[dia] ?? { tipo: 'ejercicio', ejercicios: [] };
      const orden = diaActual.ejercicios.length;
      return {
        ...prev,
        [dia]: {
          ...diaActual,
          tipo: 'ejercicio',
          ejercicios: [
            ...diaActual.ejercicios,
            { ejercicio_plantilla_id: plantillaId, orden, config_por_semana: config },
          ],
        },
      };
    });
    setShowAddDia(null);
  };

  const removeEjercicioDeDia = (dia: string, idx: number) => {
    setDiasConfig((prev) => {
      const diaActual = prev[dia];
      if (!diaActual) return prev;
      const nuevas = diaActual.ejercicios.filter((_, i) => i !== idx);
      return {
        ...prev,
        [dia]: {
          ...diaActual,
          ejercicios: nuevas.map((e, i) => ({ ...e, orden: i })),
        },
      };
    });
  };

  const updateConfigSemana = (
    dia: string,
    ejIdx: number,
    semana: number,
    field: 'series' | 'rir' | 'nota',
    value: number | string
  ) => {
    setDiasConfig((prev) => {
      const diaActual = prev[dia];
      if (!diaActual) return prev;
      const ej = diaActual.ejercicios[ejIdx];
      if (!ej) return prev;
      const plantilla = getPlantillaById(plantillas, ej.ejercicio_plantilla_id);
      const config = { ...ej.config_por_semana };
      const actual = config[semana] ?? {
        series: plantilla?.series_default ?? 3,
        rir: plantilla?.rir_default ?? 2,
        nota: '',
      };
      config[semana] = { ...actual, [field]: value };
      const nuevas = [...diaActual.ejercicios];
      nuevas[ejIdx] = { ...ej, config_por_semana: config };
      return { ...prev, [dia]: { ...diaActual, ejercicios: nuevas } };
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
      config_por_semana: Record<number, ConfigSemana>;
    }> = [];

    for (const dia of DIAS_SEMANA) {
      const dc = diasConfig[dia];
      const tipo = dc?.tipo ?? 'descanso';
      dias_config[dia] = tipo;

      if (tipo === 'ejercicio' && dc?.ejercicios) {
        for (let i = 0; i < dc.ejercicios.length; i++) {
          const ej = dc.ejercicios[i];
          const plantilla = getPlantillaById(plantillas, ej.ejercicio_plantilla_id);
          const configCompleto = buildConfigPorSemana(semanas, plantilla, ej.config_por_semana);
          ejerciciosPayload.push({
            id: ej.id,
            ejercicio_plantilla_id: ej.ejercicio_plantilla_id,
            dia,
            orden: i,
            config_por_semana: configCompleto,
          });
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
                  <div className="space-y-3">
                    {dc.ejercicios.map((ej, ejIdx) => {
                      const plantilla = getPlantillaById(plantillas, ej.ejercicio_plantilla_id);
                      return (
                        <div
                          key={ejIdx}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              {plantilla?.nombre ?? 'Ejercicio'}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeEjercicioDeDia(dia, ejIdx)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Array.from({ length: semanas }, (_, i) => i + 1).map((sem) => (
                              <div key={sem} className="text-xs border border-gray-200 rounded-lg p-2 bg-white">
                                <span className="block text-gray-600 font-medium mb-2">Sem {sem}</span>
                                <div className="space-y-1.5">
                                  <div>
                                    <label className="block text-gray-500 mb-0.5">Series</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={ej.config_por_semana[sem]?.series ?? plantilla?.series_default ?? 3}
                                      onChange={(e) =>
                                        updateConfigSemana(dia, ejIdx, sem, 'series', Number(e.target.value) || 1)
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
                                        updateConfigSemana(dia, ejIdx, sem, 'rir', Number(e.target.value) || 0)
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
                                        updateConfigSemana(dia, ejIdx, sem, 'nota', e.target.value)
                                      }
                                      placeholder="Ej: subir peso, técnica..."
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
                          id={`add-${dia}`}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="">Agregar ejercicio...</option>
                          {plantillas.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const sel = document.getElementById(`add-${dia}`) as HTMLSelectElement;
                            const val = sel?.value;
                            if (val) {
                              addEjercicioADia(dia, val);
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
