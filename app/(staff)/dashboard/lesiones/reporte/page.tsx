import ReporteLesionesClient from './ReporteLesionesClient';
import { getJugadores } from '@/lib/redis';

export default async function ReporteLesionesPage() {
  const jugadores = await getJugadores();
  return <ReporteLesionesClient jugadores={jugadores} />;
}
