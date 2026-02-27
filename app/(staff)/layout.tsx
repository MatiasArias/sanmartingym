import { getTokenPayload } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUsuarioById, getComentariosNuevosCount } from '@/lib/redis';
import StaffNav from '@/components/nav/StaffNav';
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
  const comentariosNuevos = await getComentariosNuevosCount(payload.id as string);

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

      <StaffNav comentariosNuevos={comentariosNuevos} />
    </div>
  );
}
