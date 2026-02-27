'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, CheckCircle, TrendingUp, User } from 'lucide-react';

const LINKS = [
  { href: '/home', icon: Home, label: 'Inicio' },
  { href: '/rutina', icon: Dumbbell, label: 'Rutina' },
  { href: '/asistencia', icon: CheckCircle, label: 'Asistencia' },
  { href: '/progreso', icon: TrendingUp, label: 'Progreso' },
  { href: '/perfil', icon: User, label: 'Perfil' },
] as const;

export default function JugadorNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="grid grid-cols-5 gap-1 px-1 py-2">
        {LINKS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/home' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition ${
                isActive
                  ? 'bg-sanmartin-red text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-sanmartin-red'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
