import {
  getRutinaById,
  getEjerciciosByRutina,
  getAllCategorias,
  getAllPlantillasEjercicio,
} from '@/lib/redis';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RutinaForm from '../../RutinaForm';

export default async function EditarRutinaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [rutina, categorias, plantillas] = await Promise.all([
    getRutinaById(id),
    getAllCategorias(),
    getAllPlantillasEjercicio(),
  ]);

  if (!rutina) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Rutina no encontrada</p>
          <Link href="/dashboard/rutinas" className="text-sanmartin-red hover:underline mt-2 inline-block">
            Volver a rutinas
          </Link>
        </div>
      </div>
    );
  }

  const ejercicios = await getEjerciciosByRutina(id);

  return (
    <div className="p-4 space-y-4">
      <Link
        href={`/dashboard/rutinas/${id}`}
        className="inline-flex items-center gap-2 text-sanmartin-red hover:underline"
      >
        <ArrowLeft size={20} />
        Volver
      </Link>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Editar rutina</h1>
        <p className="text-gray-600 text-sm mb-6">{rutina.nombre}</p>

        <RutinaForm
          categorias={categorias}
          plantillas={plantillas}
          rutina={rutina}
          ejercicios={ejercicios}
        />
      </div>
    </div>
  );
}
