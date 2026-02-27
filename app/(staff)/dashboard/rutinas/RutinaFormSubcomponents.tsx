'use client';

import { Plus, Trash2, Trophy, Moon, Dumbbell } from 'lucide-react';
import type { Categoria, EjercicioPlantilla, TipoDia } from '@/lib/redis';
import { RUTINA_SEMANAS_MIN, RUTINA_SEMANAS_MAX } from '@/lib/constants';
import Card from '@/components/ui/Card';

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

export interface ConfigSemanaForm {
  series: number;
  repeticiones?: number;
  rir: number;
  nota?: string;
}

export interface EjercicioEnDiaForm {
  id?: string;
  ejercicio_plantilla_id: string;
  orden: number;
  config_por_semana: Record<number, ConfigSemanaForm>;
}

export interface CircuitoEnDiaForm {
  nombre: string;
  ejercicios: EjercicioEnDiaForm[];
}

export interface DiaConfigForm {
  tipo: TipoDia;
  circuitos: CircuitoEnDiaForm[];
}

const TIPO_OPCIONES: { tipo: TipoDia; icon: React.ReactNode; label: string }[] = [
  { tipo: 'partido', icon: <Trophy size={20} />, label: 'Día de partido' },
  { tipo: 'descanso', icon: <Moon size={20} />, label: 'Día de descanso' },
  { tipo: 'ejercicio', icon: <Dumbbell size={20} />, label: 'Día de ejercicio' },
];

export function getPlantillaById(
  plantillas: EjercicioPlantilla[],
  id: string
): EjercicioPlantilla | undefined {
  return plantillas.find((p) => p.id === id);
}

/** Datos básicos: categoría, nombre, fecha inicio, semanas */
export function RutinaDatosBasicos({
  categoriaId,
  setCategoriaId,
  nombre,
  setNombre,
  fechaInicio,
  setFechaInicio,
  semanas,
  setSemanas,
  categorias,
}: {
  categoriaId: string;
  setCategoriaId: (v: string) => void;
  nombre: string;
  setNombre: (v: string) => void;
  fechaInicio: string;
  setFechaInicio: (v: string) => void;
  semanas: number;
  setSemanas: (v: number) => void;
  categorias: Categoria[];
}) {
  return (
    <Card title="Datos de la rutina">
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
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
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
            min={RUTINA_SEMANAS_MIN}
            max={RUTINA_SEMANAS_MAX}
            value={semanas}
            onChange={(e) =>
              setSemanas(
                Math.min(
                  RUTINA_SEMANAS_MAX,
                  Math.max(RUTINA_SEMANAS_MIN, Number(e.target.value) || RUTINA_SEMANAS_MIN)
                )
              )
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>
    </Card>
  );
}

/** Un día: tipo partido/descanso/ejercicio + contenido */
export function RutinaDiaBloque({
  dia,
  dc,
  mostrarOpciones,
  onShowOptions,
  onCancelOptions,
  onSetTipoDia,
  children,
}: {
  dia: string;
  dc: DiaConfigForm;
  mostrarOpciones: boolean;
  onShowOptions: () => void;
  onCancelOptions: () => void;
  onSetTipoDia: (tipo: TipoDia) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 capitalize">{dia}</h3>
        {dc.tipo === 'descanso' && !mostrarOpciones && (
          <button
            type="button"
            onClick={onShowOptions}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus size={16} />
            Configurar
          </button>
        )}
        {dc.tipo !== 'descanso' && !mostrarOpciones && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                dc.tipo === 'partido'
                  ? 'bg-amber-100 text-amber-800'
                  : dc.tipo === 'ejercicio'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100'
              }`}
            >
              {dc.tipo === 'partido' && 'Partido'}
              {dc.tipo === 'ejercicio' && 'Ejercicio'}
            </span>
            <button
              type="button"
              onClick={onShowOptions}
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
              onClick={() => onSetTipoDia(opt.tipo)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-sanmartin-red hover:bg-red-50 transition"
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
          <button type="button" onClick={onCancelOptions} className="px-3 py-1 text-gray-500 text-sm">
            Cancelar
          </button>
        </div>
      )}

      {dc.tipo === 'partido' && !mostrarOpciones && (
        <p className="text-sm text-amber-700">Día de partido - sin entrenamiento</p>
      )}

      {dc.tipo === 'ejercicio' && children}
    </div>
  );
}

/** Inputs de config por semana: series, repeticiones, RIR, nota */
export function ConfigSemanaInputs({
  semanas,
  configPorSemana,
  plantilla,
  onUpdate,
}: {
  semanas: number;
  configPorSemana: Record<number, ConfigSemanaForm>;
  plantilla: EjercicioPlantilla | undefined;
  onUpdate: (sem: number, field: 'series' | 'repeticiones' | 'rir' | 'nota', value: number | string) => void;
}) {
  return (
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
                value={configPorSemana[sem]?.series ?? plantilla?.series_default ?? 3}
                onChange={(e) => onUpdate(sem, 'series', Number(e.target.value) || 1)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-0.5">Repeticiones</label>
              <input
                type="number"
                min={1}
                value={configPorSemana[sem]?.repeticiones ?? plantilla?.repeticiones_default ?? 10}
                onChange={(e) => onUpdate(sem, 'repeticiones', Number(e.target.value) || 1)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-0.5">RIR</label>
              <input
                type="number"
                min={0}
                value={configPorSemana[sem]?.rir ?? plantilla?.rir_default ?? 2}
                onChange={(e) => onUpdate(sem, 'rir', Number(e.target.value) || 0)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-0.5">Nota (opcional)</label>
              <input
                type="text"
                value={configPorSemana[sem]?.nota ?? ''}
                onChange={(e) => onUpdate(sem, 'nota', e.target.value)}
                placeholder="Ej: subir peso..."
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Circuito: nombre + lista de ejercicios + agregar ejercicio */
export function CircuitoBloque({
  circuito,
  circuitIdx,
  dia,
  canRemoveCircuito,
  plantillas,
  semanas,
  gruposMusculares,
  addSelectorTipo,
  addSelectorEjercicio,
  onCircuitoNombre,
  onRemoveCircuito,
  onAddEjercicio,
  onRemoveEjercicio,
  onUpdateConfigSemana,
  onAddSelectorChange,
}: {
  circuito: CircuitoEnDiaForm;
  circuitIdx: number;
  dia: string;
  canRemoveCircuito: boolean;
  plantillas: EjercicioPlantilla[];
  semanas: number;
  gruposMusculares: string[];
  addSelectorTipo: string;
  addSelectorEjercicio: string;
  onCircuitoNombre: (nombre: string) => void;
  onRemoveCircuito: () => void;
  onAddEjercicio: (plantillaId: string) => void;
  onRemoveEjercicio: (ejIdx: number) => void;
  onUpdateConfigSemana: (
    ejIdx: number,
    sem: number,
    field: 'series' | 'repeticiones' | 'rir' | 'nota',
    value: number | string
  ) => void;
  onAddSelectorChange: (tipo: string, ejercicio: string) => void;
}) {
  const plantillasFiltradas =
    addSelectorTipo ?
      plantillas
        .filter((p) => p.musculo_principal === addSelectorTipo)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
      : [];

  return (
    <div className="border border-gray-300 rounded-xl p-4 bg-gray-50/80 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={circuito.nombre}
          onChange={(e) => onCircuitoNombre(e.target.value)}
          placeholder="Nombre del circuito (ej: Fuerza 1)"
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg font-medium text-gray-900 bg-white"
        />
        {canRemoveCircuito && (
          <button
            type="button"
            onClick={onRemoveCircuito}
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
          <div key={ejIdx} className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{plantilla?.nombre ?? 'Ejercicio'}</span>
              <button
                type="button"
                onClick={() => onRemoveEjercicio(ejIdx)}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <ConfigSemanaInputs
              semanas={semanas}
              configPorSemana={ej.config_por_semana}
              plantilla={plantilla}
              onUpdate={(sem, field, value) => onUpdateConfigSemana(ejIdx, sem, field, value)}
            />
          </div>
        );
      })}
      {plantillas.length > 0 && (
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[140px]">
            <select
              aria-label="Tipo o grupo muscular"
              value={addSelectorTipo}
              onChange={(e) => onAddSelectorChange(e.target.value, '')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Tipo / grupo muscular</option>
              {gruposMusculares.map((grupo) => (
                <option key={grupo} value={grupo}>
                  {grupo}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <select
              aria-label="Ejercicio"
              disabled={!addSelectorTipo}
              value={addSelectorEjercicio}
              onChange={(e) => onAddSelectorChange(addSelectorTipo, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Ejercicio</option>
              {plantillasFiltradas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              if (addSelectorEjercicio) onAddEjercicio(addSelectorEjercicio);
            }}
            className="px-4 py-2 bg-sanmartin-red text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            title="Agregar ejercicio al circuito"
          >
            <Plus size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
