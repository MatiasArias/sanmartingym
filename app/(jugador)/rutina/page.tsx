import { getTokenPayload } from '@/lib/auth';
import { getUsuarioById, getRutinaActivaByCategoria, getEjerciciosByRutinaYDia, getDiasDeRutina } from '@/lib/redis';
import { redirect } from 'next/navigation';
import RutinaClient from './RutinaClient';

export default async function RutinaPage({ searchParams }: { searchParams: { dia?: string } }) {
  const payload = await getTokenPayload();
  const usuario = await getUsuarioById(payload!.id as string);

  if (!usuario?.categoria_id) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No tenés una categoría asignada</p>
        </div>
      </div>
    );
  }

  const rutina = await getRutinaActivaByCategoria(usuario.categoria_id);

  if (!rutina) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No hay rutina activa para tu categoría</p>
        </div>
      </div>
    );
  }

  const dias = await getDiasDeRutina(rutina.id);
  const diaActual = searchParams.dia || dias[0] || 'lunes';
  const ejercicios = await getEjerciciosByRutinaYDia(rutina.id, diaActual);

  return (
    <RutinaClient
      rutina={rutina}
      ejercicios={ejercicios}
      dias={dias}
      diaActual={diaActual}
    />
  );
}
