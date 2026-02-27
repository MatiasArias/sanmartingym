'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, FileBarChart2, Pencil, CheckCircle2, XCircle } from 'lucide-react';
import type { Lesion } from '@/lib/lesiones';
import { MUSCULOS_LESION, CONTEXTOS_LESION, TIPOS_LESION } from '@/lib/lesiones-constants';
import type { Usuario } from '@/lib/redis';

type Filtro = 'activas' | 'todas';

interface Props {
  jugadores: Usuario[];
  lesionesIniciales: Lesion[];
}

const EMPTY_FORM = {
  jugador_id: '',
  musculo: '',
  contexto: '',
  tipo: '',
  fecha_inicio: '',
  notas: '',
};

function formatFecha(fecha: string | null) {
  if (!fecha) return '-';
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function LesionesClient({ jugadores, lesionesIniciales }: Props) {
  const [lesiones, setLesiones] = useState<Lesion[]>(lesionesIniciales);
  const [filtro, setFiltro] = useState<Filtro>('activas');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Lesion | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const jugadoresMap = Object.fromEntries(jugadores.map((j) => [j.id, j.nombre]));

  const lesionesVisibles = filtro === 'activas' ? lesiones.filter((l) => l.activa) : lesiones;

  function abrirCrear() {
    setEditando(null);
    setForm(EMPTY_FORM);
    setError('');
    setExito('');
    setMostrarForm(true);
  }

  function abrirEditar(lesion: Lesion) {
    setEditando(lesion);
    setForm({
      jugador_id: lesion.jugador_id,
      musculo: lesion.musculo,
      contexto: lesion.contexto,
      tipo: lesion.tipo,
      fecha_inicio: lesion.fecha_inicio,
      notas: lesion.notas,
    });
    setError('');
    setExito('');
    setMostrarForm(true);
  }

  function cerrarForm() {
    setMostrarForm(false);
    setEditando(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      if (editando) {
        const res = await fetch(`/api/staff/lesiones/${editando.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Error al actualizar');
        setLesiones((prev) => prev.map((l) => (l.id === editando.id ? data.lesion : l)));
        setExito('Lesión actualizada correctamente.');
      } else {
        const res = await fetch('/api/staff/lesiones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Error al crear');
        setLesiones((prev) => [data.lesion, ...prev]);
        setExito('Lesión registrada correctamente.');
      }
      cerrarForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  }

  async function handleDarAlta(lesion: Lesion) {
    if (!confirm(`¿Dar de alta la lesión de ${jugadoresMap[lesion.jugador_id] ?? lesion.jugador_id}?`)) return;
    try {
      const res = await fetch(`/api/staff/lesiones/${lesion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dar_alta' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al dar alta');
      setLesiones((prev) => prev.map((l) => (l.id === lesion.id ? data.lesion : l)));
      setExito('Jugador dado de alta correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lesiones</h1>
          <p className="text-sm text-gray-500 mt-1">Registrá y gestioná las lesiones de los jugadores.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/lesiones/reporte"
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:border-sanmartin-red/30 text-gray-700 bg-white"
          >
            <FileBarChart2 size={16} />
            Reporte
          </Link>
          <button
            onClick={abrirCrear}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-sanmartin-red text-white font-medium hover:bg-red-700 transition"
          >
            <Plus size={16} />
            Nueva lesión
          </button>
        </div>
      </div>

      {/* Mensajes globales */}
      {exito && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} />
          {exito}
          <button onClick={() => setExito('')} className="ml-auto text-green-500 hover:text-green-700">
            <XCircle size={16} />
          </button>
        </div>
      )}
      {error && !mostrarForm && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Modal / Formulario */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {editando ? 'Editar lesión' : 'Registrar lesión'}
              </h2>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editando && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jugador *</label>
                    <select
                      required
                      value={form.jugador_id}
                      onChange={(e) => setForm((f) => ({ ...f, jugador_id: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sanmartin-red/30"
                    >
                      <option value="">Seleccionar jugador...</option>
                      {jugadores.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Músculo / Zona *</label>
                    <select
                      required
                      value={form.musculo}
                      onChange={(e) => setForm((f) => ({ ...f, musculo: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sanmartin-red/30"
                    >
                      <option value="">Seleccionar...</option>
                      {MUSCULOS_LESION.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                    <select
                      required
                      value={form.tipo}
                      onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sanmartin-red/30"
                    >
                      <option value="">Seleccionar...</option>
                      {TIPOS_LESION.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contexto *</label>
                    <select
                      required
                      value={form.contexto}
                      onChange={(e) => setForm((f) => ({ ...f, contexto: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sanmartin-red/30"
                    >
                      <option value="">Seleccionar...</option>
                      {CONTEXTOS_LESION.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
                    <input
                      type="date"
                      required
                      value={form.fecha_inicio}
                      onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sanmartin-red/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                  <textarea
                    value={form.notas}
                    onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sanmartin-red/30 resize-none"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cerrarForm}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 px-4 py-2 rounded-lg bg-sanmartin-red text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
                  >
                    {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar lesión'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltro('activas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filtro === 'activas'
              ? 'bg-sanmartin-red text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-sanmartin-red/30'
          }`}
        >
          Solo activas
        </button>
        <button
          onClick={() => setFiltro('todas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filtro === 'todas'
              ? 'bg-sanmartin-red text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-sanmartin-red/30'
          }`}
        >
          Todas
        </button>
        <span className="ml-auto text-sm text-gray-500 self-center">
          {lesionesVisibles.length} resultado{lesionesVisibles.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {lesionesVisibles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="font-medium">No hay lesiones {filtro === 'activas' ? 'activas' : 'registradas'}.</p>
            <button
              onClick={abrirCrear}
              className="mt-3 text-sm text-sanmartin-red hover:underline"
            >
              Registrar primera lesión
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600 bg-gray-50">
                  <th className="py-3 px-4">Jugador</th>
                  <th className="py-3 px-4">Músculo</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Contexto</th>
                  <th className="py-3 px-4">Inicio</th>
                  <th className="py-3 px-4">Alta</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lesionesVisibles.map((l) => (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{jugadoresMap[l.jugador_id] ?? l.jugador_id}</td>
                    <td className="py-3 px-4">{l.musculo}</td>
                    <td className="py-3 px-4">{l.tipo}</td>
                    <td className="py-3 px-4 text-gray-600">{l.contexto}</td>
                    <td className="py-3 px-4">{formatFecha(l.fecha_inicio)}</td>
                    <td className="py-3 px-4">{l.fecha_alta ? formatFecha(l.fecha_alta) : '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          l.activa ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {l.activa ? 'Activa' : 'Alta'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(l)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        {l.activa && (
                          <button
                            onClick={() => handleDarAlta(l)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium flex items-center gap-1"
                            title="Dar de alta"
                          >
                            <CheckCircle2 size={15} />
                            Alta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
