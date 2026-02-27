'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function PerfilLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition"
    >
      <LogOut size={20} />
      Cerrar Sesión
    </button>
  );
}
