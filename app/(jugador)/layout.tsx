import { getTokenPayload } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUsuarioById } from '@/lib/usuarios';
import Image from 'next/image';
import JugadorNav from '@/components/nav/JugadorNav';

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

      <JugadorNav />
    </div>
  );
}
