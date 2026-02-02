import { getAllCategorias, getAllPlantillasEjercicio } from '@/lib/redis';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RutinaForm from '../RutinaForm';

export default async function NuevaRutinaPage() {
  const [categorias, plantillas] = await Promise.all([
    getAllCategorias(),
    getAllPlantillasEjercicio(),
  ]);

  return (
    <div className="p-4 space-y-4">
      <Link
        href="/dashboard/rutinas"
        className="inline-flex items-center gap-2 text-sanmartin-red hover:underline"
      >
        <ArrowLeft size={20} />
        Volver
      </Link>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nueva rutina</h1>
        <p className="text-gray-600 text-sm mb-6">
          Creá una nueva rutina para una categoría. Luego agregá los ejercicios por día.
        </p>

        <RutinaForm categorias={categorias} plantillas={plantillas} />
      </div>
    </div>
  );
}
