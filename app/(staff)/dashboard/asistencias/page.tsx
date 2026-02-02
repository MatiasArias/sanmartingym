'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users, CheckCircle, XCircle, CalendarDays } from 'lucide-react';

interface JugadorRef {
  id: string;
  nombre: string;
  dni: string;
  categoria_id: string;
}

interface AsistenciaDia {
  jugador: JugadorRef;
  presente: boolean;
  rpe: number | null;
}

interface AsistenciaMes {
  jugador: JugadorRef;
  diasPresente: number;
  totalDias: number;
  porcentaje: number;
  detalle: { fecha: string; presente: boolean }[];
}

type VistaAsistencia = 'dia' | 'mes';

const MESES: { value: number; label: string }[] = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

export default function AsistenciasPage() {
  const hoy = new Date();
  const [vista, setVista] = useState<VistaAsistencia>('dia');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [categoria, setCategoria] = useState('');
  const [asistenciasDia, setAsistenciasDia] = useState<AsistenciaDia[]>([]);
  const [asistenciasMes, setAsistenciasMes] = useState<AsistenciaMes[]>([]);
  const [totalDiasMes, setTotalDiasMes] = useState(0);
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCategorias([
      { id: 'cat-m15', nombre: 'M15' },
      { id: 'cat-m17', nombre: 'M17' },
      { id: 'cat-primera', nombre: 'Primera' },
      { id: 'cat-femenino', nombre: 'Femenino' },
    ]);
  }, []);

  useEffect(() => {
    fetchAsistencias();
  }, [vista, fecha, mes, anio, categoria]);

  const fetchAsistencias = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (vista === 'mes') {
        params.set('vista', 'mes');
        params.set('mes', String(mes));
        params.set('anio', String(anio));
      } else {
        params.set('vista', 'dia');
        params.set('fecha', fecha);
      }
      if (categoria) params.append('categoria', categoria);

      const res = await fetch(`/api/staff/asistencias?${params}`);
      const data = await res.json();

      if (data.vista === 'mes') {
        setAsistenciasMes(data.asistencias ?? []);
        setTotalDiasMes(data.totalDias ?? 0);
        setAsistenciasDia([]);
      } else {
        setAsistenciasDia(data.asistencias ?? []);
        setAsistenciasMes([]);
      }
    } catch (error) {
      console.error('Error fetching asistencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const presentes = asistenciasDia.filter(a => a.presente).length;
  const ausentes = asistenciasDia.length - presentes;
  const porcentajeDia = asistenciasDia.length > 0 ? Math.round((presentes / asistenciasDia.length) * 100) : 0;

  const promedioMes = asistenciasMes.length > 0
    ? Math.round(asistenciasMes.reduce((s, a) => s + a.porcentaje, 0) / asistenciasMes.length)
    : 0;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Control de Asistencias</h1>

        {/* Toggle Por día / Por mes */}
        <div className="flex rounded-lg border border-gray-300 p-1 mb-4">
          <button
            type="button"
            onClick={() => setVista('dia')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition ${
              vista === 'dia'
                ? 'bg-sanmartin-red text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar size={18} />
            Por día
          </button>
          <button
            type="button"
            onClick={() => setVista('mes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition ${
              vista === 'mes'
                ? 'bg-sanmartin-red text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CalendarDays size={18} />
            Por mes
          </button>
        </div>

        {/* Filtros según vista */}
        <div className="space-y-3">
          {vista === 'dia' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
                <select
                  value={mes}
                  onChange={(e) => setMes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
                >
                  {MESES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                <select
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
                >
                  {[hoy.getFullYear(), hoy.getFullYear() - 1, hoy.getFullYear() - 2].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      {vista === 'dia' ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <div className="text-2xl font-bold text-gray-900">{asistenciasDia.length}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <div className="text-2xl font-bold text-green-600">{presentes}</div>
              <div className="text-xs text-gray-600">Presentes</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <div className="text-2xl font-bold text-red-600">{ausentes}</div>
              <div className="text-xs text-gray-600">Ausentes</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-sanmartin-red">{porcentajeDia}%</div>
              <div className="text-sm text-gray-600">Porcentaje de asistencia (día)</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <div className="text-2xl font-bold text-gray-900">{asistenciasMes.length}</div>
              <div className="text-xs text-gray-600">Jugadores</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <div className="text-2xl font-bold text-sanmartin-red">{promedioMes}%</div>
              <div className="text-xs text-gray-600">Promedio asistencia mes</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-center text-sm text-gray-600">
              Mes de {MESES.find(m => m.value === mes)?.label} {anio} · {totalDiasMes} días
            </div>
          </div>
        </>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} />
            {vista === 'dia' ? `Jugadores (${asistenciasDia.length})` : `Resumen por jugador (${asistenciasMes.length})`}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : vista === 'dia' ? (
          asistenciasDia.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay jugadores para mostrar</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {asistenciasDia.map(asistencia => (
                <div key={asistencia.jugador.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{asistencia.jugador.nombre}</p>
                    <p className="text-sm text-gray-600">DNI: {asistencia.jugador.dni}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {asistencia.rpe != null && (
                      <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded" title="RPE (esfuerzo percibido)">
                        RPE {asistencia.rpe}
                      </span>
                    )}
                    {asistencia.presente ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={20} />
                        <span className="text-sm font-medium">Presente</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle size={20} />
                        <span className="text-sm font-medium">Ausente</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : asistenciasMes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay jugadores para mostrar</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {asistenciasMes.map(item => (
              <div key={item.jugador.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{item.jugador.nombre}</p>
                  <p className="text-sm text-gray-600">DNI: {item.jugador.dni}</p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-sm text-gray-600">
                    {item.diasPresente}/{item.totalDias} días
                  </span>
                  <span className={`text-sm font-semibold ${item.porcentaje >= 70 ? 'text-green-600' : item.porcentaje >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                    {item.porcentaje}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
