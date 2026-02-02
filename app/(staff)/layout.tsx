import { getTokenPayload } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, UserPlus, ClipboardList, Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { getUsuarioById } from '@/lib/redis';
import Image from 'next/image';
import { LogoutButton } from './LogoutButton';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getTokenPayload();

  if (!payload || payload.rol !== 'staff') {
    redirect('/login');
  }

  const usuario = await getUsuarioById(payload.id as string);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-sanmartin-black text-white shadow-lg sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="San Martín" width={40} height={40} />
            <div>
              <h1 className="font-bold text-lg">San Martín Staff</h1>
              <p className="text-xs text-gray-300">{usuario?.nombre}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Content */}
      <main className="pb-4">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-sanmartin-black border-t border-gray-700 pb-safe">
        <div className="grid grid-cols-5 gap-0.5 px-1 py-2">
          <NavLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Inicio" />
          <NavLink href="/dashboard/jugadores" icon={<UserPlus size={18} />} label="Jugadores" />
          <NavLink href="/dashboard/ejercicios" icon={<Dumbbell size={18} />} label="Ejercicios" />
          <NavLink href="/dashboard/rutinas" icon={<ClipboardList size={18} />} label="Rutinas" />
          <NavLink href="/dashboard/asistencias" icon={<Users size={18} />} label="Asistencia" />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-gray-800 transition text-gray-300 hover:text-white"
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
}
