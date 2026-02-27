import { getJugadores, getAllCategorias } from '@/lib/redis';
import Link from 'next/link';
import { TrendingUp, Layers } from 'lucide-react';
import JugadorForm from './JugadorForm';
import JugadorActivoToggle from './JugadorActivoToggle';
import type { Usuario } from '@/lib/redis';

function formatFecha(fecha?: string) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function JugadoresPage() {
  const [jugadores, categorias] = await Promise.all([
    getJugadores(),
    getAllCategorias(),
  ]);

  const categoriasMap = Object.fromEntries(categorias.map((c) => [c.id, c.nombre]));

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Jugadores</h1>
        <p className="text-gray-600 text-sm mb-4">
          Cargá jugadores para que puedan ingresar con su DNI. Cada jugador debe tener categoría asignada para ver su rutina.
        </p>
        <Link
          href="/dashboard/categorias"
          className="inline-flex items-center gap-1 text-sm text-sanmartin-red hover:underline mb-6"
        >
          <Layers size={14} />
          Gestionar categorías
        </Link>

        <JugadorForm categorias={categorias} />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Listado ({jugadores.length} jugadores)
        </h2>

        {jugadores.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay jugadores cargados. Agregá el primero con el formulario de arriba.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-2 pr-4">DNI</th>
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Fecha nac.</th>
                  <th className="py-2 pr-4">Categoría</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map((j: Usuario) => (
                  <tr key={j.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-mono">{j.dni}</td>
                    <td className="py-3 pr-4 font-medium">{j.nombre}</td>
                    <td className="py-3 pr-4">{formatFecha(j.fecha_nacimiento)}</td>
                    <td className="py-3 pr-4">{j.categoria_id ? categoriasMap[j.categoria_id] ?? j.categoria_id : '-'}</td>
                    <td className="py-3 pr-4">
                      <JugadorActivoToggle jugadorId={j.id} activo={j.activo ?? true} />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/dashboard/jugadores/${j.id}/rendimiento`}
                        className="inline-flex items-center gap-1 text-sanmartin-red font-medium hover:underline"
                      >
                        <TrendingUp size={14} />
                        Rendimiento
                      </Link>
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
