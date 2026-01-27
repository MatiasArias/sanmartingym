import { getTokenPayload } from '@/lib/auth';
import { getUsuarioById, getRutinaActivaByCategoria } from '@/lib/redis';
import { Dumbbell, CheckCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function HomePage() {
  const payload = await getTokenPayload();
  const usuario = await getUsuarioById(payload!.id as string);
  
  let rutina = null;
  if (usuario?.categoria_id) {
    rutina = await getRutinaActivaByCategoria(usuario.categoria_id);
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-sanmartin-red to-red-700 text-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">¡Hola, {usuario?.nombre?.split(' ')[0]}!</h2>
        <p className="text-red-100">Listo para entrenar hoy</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4">
        <Link
          href="/asistencia"
          className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-green-500"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Marcar Asistencia</h3>
              <p className="text-sm text-gray-600">Registrá tu presencia hoy</p>
            </div>
          </div>
        </Link>

        <Link
          href="/rutina"
          className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-sanmartin-red"
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Dumbbell className="text-sanmartin-red" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Ver Rutina</h3>
              <p className="text-sm text-gray-600">
                {rutina ? rutina.nombre : 'Cargá tu rutina'}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/progreso"
          className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-blue-500"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Mi Progreso</h3>
              <p className="text-sm text-gray-600">Historial de ejercicios</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
