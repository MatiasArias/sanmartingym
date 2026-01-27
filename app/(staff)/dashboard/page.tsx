import { getTokenPayload } from '@/lib/auth';
import { getUsuarioById, getAllRutinas, getAllUsuarios } from '@/lib/redis';
import { ClipboardList, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const payload = await getTokenPayload();
  const usuario = await getUsuarioById(payload!.id as string);
  
  const rutinas = await getAllRutinas();
  const usuarios = await getAllUsuarios();
  const jugadores = usuarios.filter(u => u.rol === 'jugador' && u.activo);

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-sanmartin-black to-gray-800 text-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">¡Hola, {usuario?.nombre?.split(' ')[0]}!</h2>
        <p className="text-gray-300">Panel de control del staff</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-sanmartin-red" size={24} />
            <span className="text-2xl font-bold text-gray-900">{jugadores.length}</span>
          </div>
          <p className="text-sm text-gray-600">Jugadores activos</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="text-sanmartin-red" size={24} />
            <span className="text-2xl font-bold text-gray-900">{rutinas.length}</span>
          </div>
          <p className="text-sm text-gray-600">Rutinas creadas</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <Link
          href="/dashboard/rutinas"
          className="block bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-sanmartin-red"
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <ClipboardList className="text-sanmartin-red" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Ver/Editar Rutinas</h3>
              <p className="text-sm text-gray-600">Gestionar rutinas por categoría</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/asistencias"
          className="block bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-blue-500"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Control de Asistencias</h3>
              <p className="text-sm text-gray-600">Ver asistencias por fecha y categoría</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
