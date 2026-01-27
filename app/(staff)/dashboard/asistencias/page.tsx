'use client';

import { useEffect, useState } from 'react';
import { Calendar, Filter, Users, CheckCircle, XCircle } from 'lucide-react';

interface Asistencia {
  jugador: {
    id: string;
    nombre: string;
    dni: string;
    categoria_id: string;
  };
  presente: boolean;
}

export default function AsistenciasPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState('');
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchAsistencias();
  }, [fecha, categoria]);

  const fetchCategorias = async () => {
    // In a real app, we'd have an endpoint for this
    setCategorias([
      { id: 'cat-m15', nombre: 'M15' },
      { id: 'cat-m17', nombre: 'M17' },
      { id: 'cat-primera', nombre: 'Primera' },
      { id: 'cat-femenino', nombre: 'Femenino' },
    ]);
  };

  const fetchAsistencias = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ fecha });
      if (categoria) params.append('categoria', categoria);

      const res = await fetch(`/api/staff/asistencias?${params}`);
      const data = await res.json();
      setAsistencias(data.asistencias);
    } catch (error) {
      console.error('Error fetching asistencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const presentes = asistencias.filter(a => a.presente).length;
  const ausentes = asistencias.length - presentes;
  const porcentaje = asistencias.length > 0 ? Math.round((presentes / asistencias.length) * 100) : 0;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Control de Asistencias</h1>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
            />
          </div>

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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
          <div className="text-2xl font-bold text-gray-900">{asistencias.length}</div>
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
          <div className="text-3xl font-bold text-sanmartin-red">{porcentaje}%</div>
          <div className="text-sm text-gray-600">Porcentaje de asistencia</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} />
            Jugadores ({asistencias.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : asistencias.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay jugadores para mostrar</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {asistencias.map(asistencia => (
              <div key={asistencia.jugador.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{asistencia.jugador.nombre}</p>
                  <p className="text-sm text-gray-600">DNI: {asistencia.jugador.dni}</p>
                </div>
                <div>
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
        )}
      </div>
    </div>
  );
}
