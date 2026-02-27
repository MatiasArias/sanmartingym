'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserPlus, ClipboardList, Dumbbell, MoreHorizontal } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LINKS: { href: string; icon: React.ComponentType<any>; label: string }[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/dashboard/jugadores', icon: UserPlus, label: 'Jugadores' },
  { href: '/dashboard/ejercicios', icon: Dumbbell, label: 'Ejercicios' },
  { href: '/dashboard/rutinas', icon: ClipboardList, label: 'Rutinas' },
  { href: '/dashboard/asistencias', icon: Users, label: 'Asistencia' },
  { href: '/dashboard/mas', icon: MoreHorizontal, label: 'Más' },
];

export default function StaffNav({ comentariosNuevos = 0 }: { comentariosNuevos?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-sanmartin-black border-t border-gray-700 pb-safe">
      <div className="grid grid-cols-6 gap-0.5 px-1 py-2">
        {LINKS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
          const isRutinas = href === '/dashboard/rutinas';
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition ${
                isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} />
              {isRutinas && comentariosNuevos > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-sanmartin-red text-white text-xs font-bold rounded-full px-1">
                  {comentariosNuevos > 99 ? '99+' : comentariosNuevos}
                </span>
              )}
              <span className="text-xs mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
