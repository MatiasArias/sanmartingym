'use client';

/**
 * Vista de estadísticas del jugador (propio usuario).
 * Solo períodos: por semana y por mes. Sin edición de peso ni reporte PDF.
 */

import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import StatCard from '@/components/stats/StatCard';
import StatsGrid from '@/components/stats/StatsGrid';
import PerformanceChart from '@/components/stats/PerformanceChart';
import Sparkline from '@/components/stats/Sparkline';
import type { RegistroCarga } from '@/lib/redis';

type EjercicioRendimiento = {
  nombre: string;
  tipo: 'empuje' | 'traccion' | 'movilidad';
  registros: RegistroCarga[];
  pesoMax: number;
  mejorSerie: { peso: number; reps: number; fecha: string };
  porFecha: { fecha: string; pesoMax: number }[];
};

type RendimientoData = {
  jugador: { id: string; nombre: string; peso_kg: number | null };
  periodo: { desde: string; hasta: string };
  asistencia: { diasPresente: number; totalDias: number; porcentaje: number; fechas: string[] };
  wellness?: {
    sesiones: { fecha: string; score: number }[];
    promedioScore: number | null;
    diasCompletados: number;
  };
  rpe?: {
    sesiones: { fecha: string; rpe: number }[];
    promedioRpe: number | null;
    diasConRpe: number;
  };
  ejercicios: Record<string, EjercicioRendimiento>;
  registros: RegistroCarga[];
  metricas: { rmRelativaPorEjercicio: Record<string, number | null> | null };
};

const PERIODOS = [
  { value: 'semana', label: 'Por semana' },
  { value: 'mes', label: 'Por mes' },
];

function formatFecha(fecha: string) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatFechaCorta(fecha: string) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function epley1RM(peso: number, reps: number): number {
  if (reps <= 0) return peso;
  return peso * (1 + reps / 30);
}

export default function EstadisticasJugadorClient() {
  const [periodo, setPeriodo] = useState<'semana' | 'mes'>('mes');
  const [data, setData] = useState<RendimientoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/jugador/rendimiento?periodo=${periodo}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar estadísticas');
        return res.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? 'Error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [periodo]);

  const chartEvolucionGlobal = useMemo(() => {
    if (!data) return [];
    const fechasSet = new Set<string>();
    Object.values(data.ejercicios).forEach((ej) => ej.porFecha.forEach((p) => fechasSet.add(p.fecha)));
    const fechasOrdenadas = Array.from(fechasSet).sort();
    return fechasOrdenadas.map((fecha) => {
      let peso = 0;
      Object.values(data.ejercicios).forEach((ej) => {
        const p = ej.porFecha.find((x) => x.fecha === fecha);
        if (p && p.pesoMax > peso) peso = p.pesoMax;
      });
      return { fecha, fechaLabel: formatFechaCorta(fecha), peso };
    });
  }, [data]);

  const ultimoRMEstimado = useMemo(() => {
    if (!data) return null;
    let max = 0;
    Object.values(data.ejercicios).forEach((ej) => {
      const { peso, reps } = ej.mejorSerie;
      if (peso > 0 && reps > 0) {
        const rm = epley1RM(peso, reps);
        if (rm > max) max = rm;
      }
    });
    return max > 0 ? Math.round(max * 10) / 10 : null;
  }, [data]);

  const progresoPeriodo = useMemo(() => {
    if (!data || chartEvolucionGlobal.length < 2) return null;
    const mid = Math.floor(chartEvolucionGlobal.length / 2);
    const firstHalf = chartEvolucionGlobal.slice(0, mid);
    const secondHalf = chartEvolucionGlobal.slice(mid);
    const max1 = Math.max(0, ...firstHalf.map((d) => d.peso));
    const max2 = Math.max(0, ...secondHalf.map((d) => d.peso));
    if (max1 === 0) return null;
    return Math.round(((max2 - max1) / max1) * 100);
  }, [data, chartEvolucionGlobal]);

  const ejercicioClave = useMemo(() => {
    if (!data) return null;
    const entries = Object.entries(data.ejercicios).sort((a, b) => b[1].pesoMax - a[1].pesoMax);
    return entries[0] ?? null;
  }, [data]);

  const rpePorFecha = useMemo(() => {
    if (!data?.rpe?.sesiones) return new Map<string, number>();
    return new Map(data.rpe.sesiones.map((s) => [s.fecha, s.rpe]));
  }, [data]);

  const tablaRegistros = useMemo(() => {
    if (!data) return [];
    return [...data.registros]
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.timestamp.localeCompare(a.timestamp))
      .slice(0, 50)
      .map((r) => ({
        fecha: r.fecha,
        ejercicio: data.ejercicios[r.ejercicio_id]?.nombre ?? r.ejercicio_id,
        peso: r.peso,
        reps: r.reps,
        rpeSesion: rpePorFecha.get(r.fecha) ?? null,
      }));
  }, [data, rpePorFecha]);

  const bienestarPorFecha = useMemo(() => {
    const wellness = data?.wellness?.sesiones ?? [];
    const rpe = data?.rpe?.sesiones ?? [];
    const fechasSet = new Set([...wellness.map((s) => s.fecha), ...rpe.map((s) => s.fecha)]);
    return Array.from(fechasSet)
      .sort()
      .reverse()
      .slice(0, 30)
      .map((fecha) => ({
        fecha,
        wellnessScore: wellness.find((s) => s.fecha === fecha)?.score ?? null,
        rpe: rpe.find((s) => s.fecha === fecha)?.rpe ?? null,
      }))
      .filter((r) => r.wellnessScore != null || r.rpe != null);
  }, [data]);

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-sanmartin-red" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white shadow-sm p-6 border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Mis estadísticas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {formatFecha(data.periodo.desde)} – {formatFecha(data.periodo.hasta)}
        </p>
        <div className="flex gap-2 mt-4">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriodo(p.value as 'semana' | 'mes')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                periodo === p.value
                  ? 'bg-sanmartin-red text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <section className="rounded-2xl bg-white shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Asistencia en el período
          </h2>
          <span className="text-lg font-bold text-sanmartin-red">
            {data.asistencia.diasPresente} / {data.asistencia.totalDias} días ({data.asistencia.porcentaje}%)
          </span>
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sanmartin-red rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, data.asistencia.totalDias > 0 ? (data.asistencia.diasPresente / data.asistencia.totalDias) * 100 : 0))}%`,
            }}
          />
        </div>
      </section>

      <StatsGrid>
        <StatCard
          label="Asistencia"
          value={`${data.asistencia.porcentaje}%`}
          sublabel={`${data.asistencia.diasPresente} de ${data.asistencia.totalDias} días`}
        />
        <StatCard
          label="Último RM estimado"
          value={ultimoRMEstimado != null ? `${ultimoRMEstimado} kg` : '—'}
          sublabel="Mejor serie (Epley)"
        />
        <StatCard
          label="Progreso en el período"
          value={
            progresoPeriodo != null
              ? `${progresoPeriodo > 0 ? '+' : ''}${progresoPeriodo}%`
              : '—'
          }
          sublabel="Peso máx. 2ª mitad vs 1ª"
        />
        <StatCard
          label="Sesiones completadas"
          value={data.asistencia.diasPresente}
          sublabel={`de ${data.asistencia.totalDias} días`}
        />
        <StatCard
          label="Wellness promedio"
          value={
            data.wellness?.promedioScore != null
              ? `${data.wellness.promedioScore}/25`
              : '—'
          }
          sublabel={`${data.wellness?.diasCompletados ?? 0} días con cuestionario`}
        />
        <StatCard
          label="RPE promedio (sesión)"
          value={
            data.rpe?.promedioRpe != null
              ? `${data.rpe.promedioRpe} (1-10)`
              : '—'
          }
          sublabel={`${data.rpe?.diasConRpe ?? 0} sesiones con RPE`}
        />
      </StatsGrid>

      {chartEvolucionGlobal.length > 0 && (
        <section className="rounded-2xl bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Evolución del peso en el tiempo
          </h2>
          <PerformanceChart data={chartEvolucionGlobal} />
        </section>
      )}

      {bienestarPorFecha.length > 0 && (
        <section className="rounded-2xl bg-white shadow-sm overflow-hidden border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide p-4 pb-0">
            Bienestar y esfuerzo por fecha
          </h2>
          <p className="text-xs text-gray-400 px-4 pt-1 pb-3">
            Wellness (0-25) y RPE de sesión (1-10).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Fecha</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Wellness</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">RPE sesión</th>
                </tr>
              </thead>
              <tbody>
                {bienestarPorFecha.map((r) => (
                  <tr key={r.fecha} className="border-b border-gray-50">
                    <td className="py-2.5 px-4 text-gray-700">{formatFecha(r.fecha)}</td>
                    <td className="py-2.5 px-4 text-right text-gray-900">
                      {r.wellnessScore != null ? `${r.wellnessScore}/25` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-sanmartin-red">
                      {r.rpe != null ? r.rpe : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {ejercicioClave && ejercicioClave[1].porFecha.length > 0 && (
        <Sparkline
          title={`${ejercicioClave[1].nombre} (peso máx)`}
          value={`${ejercicioClave[1].pesoMax} kg`}
          data={ejercicioClave[1].porFecha.map((p) => ({
            label: formatFechaCorta(p.fecha),
            value: p.pesoMax,
          }))}
        />
      )}

      <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide p-4 pb-0">
          Últimos registros
        </h2>
        {tablaRegistros.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No hay registros en el período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Ejercicio</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Peso</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Reps</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">RPE sesión</th>
                </tr>
              </thead>
              <tbody>
                {tablaRegistros.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5 px-4 text-gray-700">{formatFecha(r.fecha)}</td>
                    <td className="py-2.5 px-4 text-gray-900">{r.ejercicio}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-sanmartin-red">
                      {r.peso} kg
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-600">{r.reps}</td>
                    <td className="py-2.5 px-4 text-right text-gray-600">
                      {r.rpeSesion != null ? r.rpeSesion : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
