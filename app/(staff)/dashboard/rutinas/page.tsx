import { getAllRutinas, getAllCategorias } from '@/lib/redis';
import Link from 'next/link';
import { Eye, Calendar } from 'lucide-react';

export default async function RutinasPage() {
  const rutinas = await getAllRutinas();
  const categorias = await getAllCategorias();

  const rutinasPorCategoria = categorias.map(cat => ({
    categoria: cat,
    rutinas: rutinas.filter(r => r.categoria_id === cat.id),
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900">Rutinas</h1>
        <p className="text-gray-600">Gestionar rutinas por categoría</p>
      </div>

      <div className="space-y-6">
        {rutinasPorCategoria.map(({ categoria, rutinas: ruts }) => (
          <div key={categoria.id} className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{categoria.nombre}</h2>
            
            {ruts.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay rutinas para esta categoría</p>
            ) : (
              <div className="space-y-3">
                {ruts.map(rutina => {
                  const hoy = new Date().toISOString().split('T')[0];
                  const activa = rutina.fecha_inicio <= hoy && rutina.fecha_fin >= hoy;

                  return (
                    <Link
                      key={rutina.id}
                      href={`/dashboard/rutinas/${rutina.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-sanmartin-red hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{rutina.nombre}</h3>
                        {activa && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                            Activa
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>{rutina.fecha_inicio} - {rutina.fecha_fin}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
