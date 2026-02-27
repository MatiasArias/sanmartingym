import { getUsuarioById, getAllCategorias } from '@/lib/redis';
import { config } from '@/lib/config';
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
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-6">
        <Link
          href="/dashboard/jugadores"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-sanmartin-red"
          aria-label="Volver a jugadores"
        >
          <ArrowLeft size={18} />
          Volver a jugadores
        </Link>

        <RendimientoClient
          jugadorId={id}
          jugadorNombre={jugador.nombre}
          categoriaNombre={categoriaNombre ?? null}
          reportePdfHabilitado={config.reportePdfHabilitado ?? true}
        />
      </div>
    </div>
  );
}
