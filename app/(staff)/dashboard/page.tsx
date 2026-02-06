import { getTokenPayload } from '@/lib/auth';
import { getUsuarioById, getAllRutinas, getAllUsuarios, getComentariosNuevosCount } from '@/lib/redis';
import { ClipboardList, Users, MessageSquare, Heart, History, Layers } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const payload = await getTokenPayload();
  const usuario = await getUsuarioById(payload!.id as string);
  const comentariosNuevos = await getComentariosNuevosCount(payload!.id as string);
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

      {/* Notificación comentarios nuevos */}
      {comentariosNuevos > 0 && (
        <Link
          href="/dashboard/rutinas"
          className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition"
        >
          <div className="bg-amber-500 p-2 rounded-full">
            <MessageSquare className="text-white" size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-900">
              {comentariosNuevos} {comentariosNuevos === 1 ? 'comentario nuevo' : 'comentarios nuevos'}
            </p>
            <p className="text-sm text-amber-700">En ejercicios de rutinas. Tocá para ver.</p>
          </div>
          <span className="text-amber-600 font-bold">→</span>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <Link
          href="/dashboard/comentarios"
          className="block bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-amber-500"
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <History className="text-amber-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Histórico de comentarios</h3>
              <p className="text-sm text-gray-600">Ver comentarios resueltos de jugadores</p>
            </div>
          </div>
        </Link>

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
          href="/dashboard/jugadores"
          className="block bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-green-500"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Cargar Jugadores</h3>
              <p className="text-sm text-gray-600">DNI, nombre, categoría y fecha de nacimiento</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/categorias"
          className="block bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-purple-500"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <Layers className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Cargar Categorías</h3>
              <p className="text-sm text-gray-600">Gestionar categorías para jugadores y rutinas</p>
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

        <Link
          href="/dashboard/wellness"
          className="block bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-sanmartin-red"
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Heart className="text-sanmartin-red" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Reglas Wellness</h3>
              <p className="text-sm text-gray-600">Definir adaptación de rutina (bienestar &lt; 2 → quitar 1 rep, cansancio &lt; 2 → quitar 1 serie)</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
