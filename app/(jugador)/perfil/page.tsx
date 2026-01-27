'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    // Get user info from a hypothetical endpoint or stored state
    // For now, we'll just show a placeholder
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

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
            <label className="text-sm text-gray-600">Rol</label>
            <p className="font-semibold text-gray-900">Jugador</p>
          </div>

          <div className="border-b pb-3">
            <label className="text-sm text-gray-600">Estado</label>
            <p className="font-semibold text-green-600">Activo</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition"
      >
        <LogOut size={20} />
        Cerrar Sesión
      </button>
    </div>
  );
}
