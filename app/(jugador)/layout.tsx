import { getTokenPayload } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Home, Dumbbell, CheckCircle, MessageCircle, User, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getUsuarioById } from '@/lib/redis';
import Image from 'next/image';

export default async function JugadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getTokenPayload();

  if (!payload || payload.rol !== 'jugador') {
    redirect('/login');
  }

  const usuario = await getUsuarioById(payload.id as string);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-sanmartin-red text-white shadow-lg sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="San Martín" width={40} height={40} />
            <div>
              <h1 className="font-bold text-lg">San Martín</h1>
              <p className="text-xs text-red-100">{usuario?.nombre}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-4">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          <NavLink href="/home" icon={<Home size={20} />} label="Inicio" />
          <NavLink href="/rutina" icon={<Dumbbell size={20} />} label="Rutina" />
          <NavLink href="/asistencia" icon={<CheckCircle size={20} />} label="Asistencia" />
          <NavLink href="/progreso" icon={<TrendingUp size={20} />} label="Progreso" />
          <NavLink href="/perfil" icon={<User size={20} />} label="Perfil" />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center py-2 px-1 rounded-lg hover:bg-gray-100 transition text-gray-600 hover:text-sanmartin-red"
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
}
