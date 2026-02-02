'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      type="button"
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition"
      aria-label="Cerrar sesión"
    >
      <LogOut size={18} />
      <span className="text-sm font-medium">Salir</span>
    </button>
  );
}
