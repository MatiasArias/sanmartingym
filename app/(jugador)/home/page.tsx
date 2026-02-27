import { getTokenPayload } from '@/lib/auth';
import { getUsuarioById } from '@/lib/usuarios';
import { getAllCategorias } from '@/lib/categorias';
import {
  getRutinaActivaByCategoria,
  getDiasDeRutina,
  type Ejercicio,
} from '@/lib/rutinas';
import { getRegistrosByJugador } from '@/lib/registros';
import { getAsistenciasJugadorEnRango } from '@/lib/asistencia';
import { redis } from '@/lib/redis-client';
import {
  getCurrentWeekRange,
  getLast30DaysRange,
  sesionesCompletadasEstaSemana,
  entrenamientosSemana,
  porcentajeAsistencia,
  ultimoEjercicioData,
  type UltimoEjercicioData as UltimoEjercicioDataFull,
} from '@/lib/home-jugador';
import Link from 'next/link';
import { Flame, CheckCircle, Dumbbell, TrendingUp, ChevronRight } from 'lucide-react';

/** Mini gráfico de evolución (SVG, server-safe) */
function MiniEvolucionChart({ data }: { data: { fecha: string; pesoMax: number }[] }) {
  if (data.length === 0) return null;
  const maxPeso = Math.max(...data.map((d) => d.pesoMax), 1);
  const w = 200;
  const h = 48;
  const pad = { left: 4, right: 4, top: 4, bottom: 4 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const points = data.map((d, i) => {
    const x = pad.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
    const y = pad.top + innerH - (d.pesoMax / maxPeso) * innerH;
    return `${x},${y}`;
  });
  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

  return (
    <svg width={w} height={h} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke="#E31E24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function HomePage() {
  const payload = await getTokenPayload();
  if (!payload?.id) return null;

  const usuario = await getUsuarioById(payload.id as string);
  if (!usuario) return null;

  const [categorias, rutina, registros] = await Promise.all([
    getAllCategorias(),
    usuario.categoria_id ? getRutinaActivaByCategoria(usuario.categoria_id) : null,
    getRegistrosByJugador(usuario.id),
  ]);

  const diasEjercicio = rutina != null ? await getDiasDeRutina(rutina.id) : [];
  const categoriaNombre = usuario.categoria_id
    ? categorias.find((c) => c.id === usuario.categoria_id)?.nombre ?? usuario.categoria_id
    : null;

  const { desde: semanaDesde, hasta: semanaHasta } = getCurrentWeekRange();
  const { desde: asistenciaDesde, hasta: asistenciaHasta } = getLast30DaysRange();
  const fechasAsistencia = await getAsistenciasJugadorEnRango(
    usuario.id,
    asistenciaDesde,
    asistenciaHasta
  );

  const sesionesEstaSemana = sesionesCompletadasEstaSemana(
    registros,
    semanaDesde,
    semanaHasta
  );
  const { realizados: entrenamientosRealizados, total: entrenamientosTotal } =
    entrenamientosSemana(registros, diasEjercicio, semanaDesde, semanaHasta);
  const asistenciaPct = porcentajeAsistencia(
    fechasAsistencia,
    asistenciaDesde,
    asistenciaHasta
  );

  const ultimoData = ultimoEjercicioData(registros);
  let ultimoEjercicio: UltimoEjercicioDataFull | null = null;
  if (ultimoData) {
    const ej = (await redis.get(`ejercicio:${ultimoData.ejercicioId}`)) as Ejercicio | null;
    ultimoEjercicio = { ...ultimoData, nombre: ej?.nombre ?? 'Ejercicio' };
  }

  return (
    <div className="p-4 space-y-5">
      {/* 1. Card Resumen del jugador */}
      <Link
        href="/progreso"
        className="block bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{usuario.nombre}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {categoriaNombre ?? 'Sin categoría'}
            </p>
            <p className="flex items-center gap-1.5 mt-2 text-sm text-gray-700">
              <Flame className="text-sanmartin-red" size={18} />
              Esta semana: <strong>{sesionesEstaSemana} sesiones completadas</strong>
            </p>
          </div>
          <ChevronRight className="text-gray-400 shrink-0" size={24} />
        </div>
      </Link>

      {/* 2. Card Estado semanal */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Estado semanal
        </h2>
        <p className="text-2xl font-bold text-gray-900 mb-2">
          {entrenamientosRealizados}/{entrenamientosTotal} entrenamientos
        </p>
        <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-sanmartin-red rounded-full transition-all"
            style={{
              width: `${entrenamientosTotal > 0 ? (entrenamientosRealizados / entrenamientosTotal) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          <span>Asistencia {asistenciaPct}%</span>
          <span>
            Próxima rutina: <strong className="text-gray-900">{rutina?.nombre ?? '—'}</strong>
          </span>
        </div>
        <p className="text-sm text-sanmartin-red font-medium mt-3">¡Seguimos mejorando!</p>
      </div>

      {/* 3. Acciones rápidas */}
      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/asistencia"
          className="flex items-center justify-between bg-white rounded-2xl shadow-md border-l-4 border-green-500 p-4 hover:shadow-lg transition"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Marcar Asistencia</h3>
              <p className="text-sm text-gray-600">Registrá tu presencia hoy</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400 shrink-0" size={22} />
        </Link>

        <Link
          href="/rutina"
          className="flex items-center justify-between bg-white rounded-2xl shadow-md border-l-4 border-sanmartin-red p-4 hover:shadow-lg transition"
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Dumbbell className="text-sanmartin-red" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Ver Rutina</h3>
              <p className="text-sm text-gray-600">
                {rutina ? rutina.nombre : 'Cargá tu rutina'}
              </p>
            </div>
          </div>
          <ChevronRight className="text-gray-400 shrink-0" size={22} />
        </Link>

        <Link
          href="/progreso"
          className="flex items-center justify-between bg-white rounded-2xl shadow-md border-l-4 border-blue-500 p-4 hover:shadow-lg transition"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Progreso</h3>
              <p className="text-sm text-gray-600">Explorar</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400 shrink-0" size={22} />
        </Link>
      </div>

      {/* 4. Card Último ejercicio */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-5 pt-5 pb-2">
          Último ejercicio
        </h2>
        {ultimoEjercicio ? (
          <Link
            href={`/progreso/${ultimoEjercicio.ejercicioId}`}
            className="block p-5 pt-0 hover:bg-gray-50/80 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{ultimoEjercicio.nombre}</p>
                <p className="text-sanmartin-red font-semibold text-xl mt-1">
                  {ultimoEjercicio.peso} kg
                </p>
                <p className="text-sm text-gray-600 mt-1">{ultimoEjercicio.progresoTexto}</p>
              </div>
              <ChevronRight className="text-gray-400 shrink-0 mt-1" size={22} />
            </div>
            {ultimoEjercicio.porFecha.length > 0 && (
              <div className="mt-4">
                <MiniEvolucionChart data={ultimoEjercicio.porFecha} />
              </div>
            )}
          </Link>
        ) : (
          <div className="px-5 pb-5 pt-0">
            <p className="text-gray-600 text-sm">
              Aún no tenés registros. Comenzá tu rutina para ver tu evolución.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
