'use client';

import { useState } from 'react';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Lesion } from '@/lib/lesiones';
import type { Usuario } from '@/lib/redis';

const COLORES = ['#E31E24', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#6B7280'];

interface Props {
  jugadores: Usuario[];
}

function contarPor(lesiones: Lesion[], campo: keyof Lesion) {
  const mapa: Record<string, number> = {};
  for (const l of lesiones) {
    const v = String(l[campo] ?? 'Sin dato');
    mapa[v] = (mapa[v] ?? 0) + 1;
  }
  return Object.entries(mapa)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '-';
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ReporteLesionesClient({ jugadores }: Props) {
  const jugadoresMap = Object.fromEntries(jugadores.map((j) => [j.id, j.nombre]));

  const today = new Date().toISOString().split('T')[0]!;
  const primerDiaMes = today.slice(0, 7) + '-01';

  const [desde, setDesde] = useState(primerDiaMes);
  const [hasta, setHasta] = useState(today);
  const [lesiones, setLesiones] = useState<Lesion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await fetch(`/api/staff/lesiones?desde=${desde}&hasta=${hasta}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al cargar');
      setLesiones(data.lesiones ?? []);
      setBuscado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  }

  const porTipo = contarPor(lesiones, 'tipo');
  const porMusculo = contarPor(lesiones, 'musculo');
  const porContexto = contarPor(lesiones, 'contexto');

  function handlePrint() {
    window.print();
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/lesiones"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 no-print"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reporte de lesiones</h1>
            <p className="text-sm text-gray-500 mt-0.5">Análisis por período con gráficos de distribución.</p>
          </div>
        </div>
        {buscado && lesiones.length > 0 && (
          <button
            onClick={handlePrint}
            className="no-print inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700"
          >
            <Printer size={16} />
            Imprimir / PDF
          </button>
        )}
      </div>

      {/* Filtros */}
      <form onSubmit={buscar} className="no-print bg-white rounded-xl shadow-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Rango de fechas</h2>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              required
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sanmartin-red/30"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              required
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sanmartin-red/30"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={cargando}
              className="w-full sm:w-auto px-6 py-2 rounded-lg bg-sanmartin-red text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
            >
              {cargando && <Loader2 size={14} className="animate-spin" />}
              Generar reporte
            </button>
          </div>
        </div>
      </form>

      {buscado && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total lesiones', value: lesiones.length },
              { label: 'Activas', value: lesiones.filter((l) => l.activa).length },
              { label: 'Dadas de alta', value: lesiones.filter((l) => !l.activa).length },
              { label: 'Jugadores afectados', value: new Set(lesiones.map((l) => l.jugador_id)).size },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl shadow-md p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                <p className="text-3xl font-bold text-sanmartin-red mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>

          {lesiones.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
              <p>No se encontraron lesiones en el período seleccionado.</p>
            </div>
          ) : (
            <>
              {/* Gráficos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Por tipo */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                    Por tipo de lesión
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={porTipo}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                        labelLine={false}
                      >
                        {porTipo.map((_, i) => (
                          <Cell key={i} fill={COLORES[i % COLORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Por músculo */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                    Por músculo / zona
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={porMusculo}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                        labelLine={false}
                      >
                        {porMusculo.map((_, i) => (
                          <Cell key={i} fill={COLORES[i % COLORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Por contexto */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                    Por contexto
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={porContexto}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                        labelLine={false}
                      >
                        {porContexto.map((_, i) => (
                          <Cell key={i} fill={COLORES[i % COLORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leyenda de colores */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex flex-wrap gap-3">
                  {porTipo.map((item, i) => (
                    <span key={item.name} className="flex items-center gap-1.5 text-sm text-gray-700">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: COLORES[i % COLORES.length] }}
                      />
                      {item.name}: {item.value}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabla detalle */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">
                    Listado de lesiones — {desde} al {hasta}
                  </h3>
                </div>
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
                      </tr>
                    </thead>
                    <tbody>
                      {lesiones.map((l) => (
                        <tr key={l.id} className="border-b border-gray-100">
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
