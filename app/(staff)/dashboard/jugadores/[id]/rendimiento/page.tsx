import { getUsuarioById, getAllCategorias } from '@/lib/redis';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RendimientoClient from './RendimientoClient';

export default async function RendimientoJugadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [jugador, categorias] = await Promise.all([
    getUsuarioById(id),
    getAllCategorias(),
  ]);

  if (!jugador || jugador.rol !== 'jugador') {
    notFound();
  }

  const categoriasMap = Object.fromEntries(categorias.map((c) => [c.id, c.nombre]));
  const categoriaNombre = jugador.categoria_id ? categoriasMap[jugador.categoria_id] ?? jugador.categoria_id : null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/jugadores"
          className="p-2 rounded-lg hover:bg-gray-200 text-gray-700"
          aria-label="Volver a jugadores"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rendimiento</h1>
          <p className="text-sm text-gray-600">
            {jugador.nombre}
            {categoriaNombre && ` · ${categoriaNombre}`}
          </p>
        </div>
      </div>

      <RendimientoClient jugadorId={id} jugadorNombre={jugador.nombre} />
    </div>
  );
}
