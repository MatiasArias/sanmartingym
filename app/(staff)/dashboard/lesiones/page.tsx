import { getJugadores } from '@/lib/redis';
import { getAllLesiones } from '@/lib/lesiones';
import LesionesClient from './LesionesClient';

export default async function LesionesPage() {
  const [jugadores, lesiones] = await Promise.all([getJugadores(), getAllLesiones()]);

  return <LesionesClient jugadores={jugadores} lesionesIniciales={lesiones} />;
}
