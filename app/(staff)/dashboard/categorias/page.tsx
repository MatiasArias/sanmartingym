import { getAllCategorias } from '@/lib/redis';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import CategoriaForm from './CategoriaForm';
import type { Categoria } from '@/lib/redis';

export default async function CategoriasPage() {
  const categorias = await getAllCategorias();

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Categorías</h1>
        <p className="text-gray-600 text-sm mb-6">
          Cargá categorías para asignar a jugadores y rutinas (ej. M15, M17, Primera, Femenino).
        </p>

        <CategoriaForm />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Layers size={20} />
          Categorías ({categorias.length})
        </h2>

        {categorias.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No hay categorías cargadas. Agregá la primera con el formulario de arriba.
          </p>
        ) : (
          <ul className="space-y-2">
            {categorias.map((c: Categoria) => (
              <li
                key={c.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-900">{c.nombre}</span>
                <Link
                  href={`/dashboard/rutinas?categoria=${c.id}`}
                  className="text-sm text-sanmartin-red hover:underline"
                >
                  Ver rutinas
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
