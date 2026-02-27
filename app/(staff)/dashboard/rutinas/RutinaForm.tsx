'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import type { Rutina, Ejercicio, Categoria, EjercicioPlantilla, TipoDia } from '@/lib/redis';
import { RUTINA_SEMANAS_MIN, RUTINA_SEMANAS_MAX } from '@/lib/constants';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Button from '@/components/ui/Button';
import {
  RutinaDatosBasicos,
  RutinaDiaBloque,
  CircuitoBloque,
  getPlantillaById,
  type ConfigSemanaForm,
  type EjercicioEnDiaForm,
  type CircuitoEnDiaForm,
  type DiaConfigForm,
} from './RutinaFormSubcomponents';

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

type ConfigSemana = ConfigSemanaForm;

type EjercicioEnDia = EjercicioEnDiaForm;
type CircuitoEnDia = CircuitoEnDiaForm;
type DiaConfig = DiaConfigForm;

interface RutinaFormProps {
  categorias: Categoria[];
  plantillas: EjercicioPlantilla[];
  rutina?: Rutina;
  ejercicios?: Ejercicio[];
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

  /** Estado del selector en dos niveles (tipo → ejercicio) por circuito: key = `${dia}-${circuitIdx}` */
  const [addSelectorByCircuit, setAddSelectorByCircuit] = useState<Record<string, { tipo: string; ejercicio: string }>>({});

  /** Grupos musculares únicos de plantillas, ordenados alfabéticamente */
  const gruposMusculares = useMemo(() => {
    const grupos = Array.from(new Set(plantillas.map((p) => p.musculo_principal).filter(Boolean)));
    return grupos.sort((a, b) => a.localeCompare(b));
  }, [plantillas]);

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
    if (semanas < RUTINA_SEMANAS_MIN || semanas > RUTINA_SEMANAS_MAX) {
      setError(`La rutina debe durar entre ${RUTINA_SEMANAS_MIN} y ${RUTINA_SEMANAS_MAX} semanas`);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorMessage message={error} />

      <RutinaDatosBasicos
        categoriaId={categoriaId}
        setCategoriaId={setCategoriaId}
        nombre={nombre}
        setNombre={setNombre}
        fechaInicio={fechaInicio}
        setFechaInicio={setFechaInicio}
        semanas={semanas}
        setSemanas={setSemanas}
        categorias={categorias}
      />

      {/* Días de la semana */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Configuración por día</h2>
        <p className="text-sm text-gray-600 mb-4">
          Definí qué tipo de día es cada uno (lunes a sábado). Luego agregá ejercicios a los días de entrenamiento.
        </p>

        <div className="space-y-4">
          {DIAS_SEMANA.map((dia) => {
            const dc = diasConfig[dia] ?? { tipo: 'descanso', circuitos: [] };
            const mostrarOpciones = showAddDia === DIAS_SEMANA.indexOf(dia);

            return (
              <RutinaDiaBloque
                key={dia}
                dia={dia}
                dc={dc}
                mostrarOpciones={mostrarOpciones}
                onShowOptions={() => setShowAddDia(DIAS_SEMANA.indexOf(dia))}
                onCancelOptions={() => setShowAddDia(null)}
                onSetTipoDia={(tipo) => setTipoDia(dia, tipo)}
              >
                <div className="space-y-4">
                    {(dc.circuitos ?? [{ nombre: '', ejercicios: [] }]).map((circuito, circuitIdx) => (
                      <CircuitoBloque
                        key={circuitIdx}
                        circuito={circuito}
                        circuitIdx={circuitIdx}
                        dia={dia}
                        canRemoveCircuito={(dc.circuitos?.length ?? 1) > 1}
                        plantillas={plantillas}
                        semanas={semanas}
                        gruposMusculares={gruposMusculares}
                        addSelectorTipo={addSelectorByCircuit[`${dia}-${circuitIdx}`]?.tipo ?? ''}
                        addSelectorEjercicio={addSelectorByCircuit[`${dia}-${circuitIdx}`]?.ejercicio ?? ''}
                        onCircuitoNombre={(nombre) => setCircuitoNombre(dia, circuitIdx, nombre)}
                        onRemoveCircuito={() => removeCircuito(dia, circuitIdx)}
                        onAddEjercicio={(plantillaId) => {
                          addEjercicioACircuito(dia, circuitIdx, plantillaId);
                          setAddSelectorByCircuit((prev) => {
                            const next = { ...prev };
                            delete next[`${dia}-${circuitIdx}`];
                            return next;
                          });
                        }}
                        onRemoveEjercicio={(ejIdx) => removeEjercicioDeCircuito(dia, circuitIdx, ejIdx)}
                        onUpdateConfigSemana={(ejIdx, sem, field, value) =>
                          updateConfigSemana(dia, circuitIdx, ejIdx, sem, field, value)
                        }
                        onAddSelectorChange={(tipo, ejercicio) =>
                          setAddSelectorByCircuit((prev) => ({
                            ...prev,
                            [`${dia}-${circuitIdx}`]: { tipo, ejercicio },
                          }))
                        }
                      />
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
                </RutinaDiaBloque>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1 py-3">
          {loading ? 'Guardando...' : rutina ? 'Actualizar rutina' : 'Crear rutina'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} className="px-6 py-3">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
