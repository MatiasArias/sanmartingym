import { getTokenPayload } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUsuarioById, getAllCategorias } from '@/lib/redis';
import { User } from 'lucide-react';
import PerfilLogoutButton from './PerfilLogoutButton';

function enmascararDni(dni: string): string {
  if (!dni || dni.length < 4) return '•••';
  return dni.slice(0, 2) + '••••••' + dni.slice(-2);
}

export default async function PerfilPage() {
  const payload = await getTokenPayload();
  if (!payload || payload.rol !== 'jugador') {
    redirect('/login');
  }

  const usuario = await getUsuarioById(payload.id as string);
  if (!usuario) {
    redirect('/login');
  }

  const categorias = await getAllCategorias();
  const categoriaNombre = usuario.categoria_id
    ? categorias.find((c) => c.id === usuario.categoria_id)?.nombre ?? usuario.categoria_id
    : null;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-sanmartin-red text-white p-4 rounded-full">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
            <p className="text-gray-600">Información personal</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-b pb-3">
            <label className="text-sm text-gray-600">Nombre</label>
            <p className="font-semibold text-gray-900">{usuario.nombre}</p>
          </div>
          <div className="border-b pb-3">
            <label className="text-sm text-gray-600">DNI</label>
            <p className="font-semibold text-gray-900">{enmascararDni(usuario.dni)}</p>
          </div>
          {categoriaNombre && (
            <div className="border-b pb-3">
              <label className="text-sm text-gray-600">Categoría</label>
              <p className="font-semibold text-gray-900">{categoriaNombre}</p>
            </div>
          )}
          {usuario.fecha_nacimiento && (
            <div className="border-b pb-3">
              <label className="text-sm text-gray-600">Fecha de nacimiento</label>
              <p className="font-semibold text-gray-900">
                {new Date(usuario.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}
          <div className="border-b pb-3">
            <label className="text-sm text-gray-600">Estado</label>
            <p className={`font-semibold ${usuario.activo ? 'text-green-600' : 'text-gray-500'}`}>
              {usuario.activo ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>
      </div>

      <PerfilLogoutButton />
    </div>
  );
}
