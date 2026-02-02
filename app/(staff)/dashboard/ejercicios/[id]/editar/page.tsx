import { getPlantillaEjercicioById } from '@/lib/redis';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EjercicioForm from '../../EjercicioForm';

export default async function EditarEjercicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ejercicio = await getPlantillaEjercicioById(id);

  if (!ejercicio) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Ejercicio no encontrado</p>
          <Link
            href="/dashboard/ejercicios"
            className="text-sanmartin-red hover:underline mt-2 inline-block"
          >
            Volver a ejercicios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Link
        href="/dashboard/ejercicios"
        className="inline-flex items-center gap-2 text-sanmartin-red hover:underline"
      >
        <ArrowLeft size={20} />
        Volver
      </Link>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Editar ejercicio</h1>
        <p className="text-gray-600 text-sm mb-6">{ejercicio.nombre}</p>

        <EjercicioForm ejercicio={ejercicio} />
      </div>
    </div>
  );
}
