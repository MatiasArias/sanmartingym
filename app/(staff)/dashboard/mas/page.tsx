import Link from 'next/link';
import { Layers, Heart, Bandage } from 'lucide-react';

export default function MasPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Más</h1>
      <p className="text-sm text-gray-600">Acceso rápido a categorías, wellness y lesiones.</p>
      <div className="grid gap-3">
        <Link
          href="/dashboard/categorias"
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow border border-gray-100 hover:border-sanmartin-red/30 transition"
        >
          <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
            <Layers size={24} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Categorías</p>
            <p className="text-sm text-gray-500">Gestionar categorías (M15, M17, etc.)</p>
          </div>
        </Link>
        <Link
          href="/dashboard/wellness"
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow border border-gray-100 hover:border-sanmartin-red/30 transition"
        >
          <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
            <Heart size={24} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Wellness</p>
            <p className="text-sm text-gray-500">Reglas de adaptación por cuestionario wellness</p>
          </div>
        </Link>
        <Link
          href="/dashboard/lesiones"
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow border border-gray-100 hover:border-sanmartin-red/30 transition"
        >
          <div className="p-2 rounded-lg bg-red-50 text-sanmartin-red">
            <Bandage size={24} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Lesiones</p>
            <p className="text-sm text-gray-500">Registrar y gestionar lesiones de jugadores</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
