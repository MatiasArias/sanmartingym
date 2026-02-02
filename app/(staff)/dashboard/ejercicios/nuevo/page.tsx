import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EjercicioForm from '../EjercicioForm';

export default function NuevoEjercicioPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nuevo ejercicio</h1>
        <p className="text-gray-600 text-sm mb-6">
          Creá un ejercicio para el catálogo. Luego podés agregarlo a las rutinas.
        </p>

        <EjercicioForm />
      </div>
    </div>
  );
}
