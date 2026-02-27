'use client';

/**
 * Vista Rendimiento del Jugador (Staff) – SPEC rediseño video Instagram.
 *
 * 🎥 Elementos replicados del video:
 * - Cards con número grande y label pequeño (StatCard)
 * - Grid de métricas (StatsGrid)
 * - Gráfico de líneas simple (PerformanceChart)
 * - Resumen arriba, evolución abajo
 * - Mucho espacio y jerarquía clara
 * - Diseño minimalista deportivo (no panel admin)
 */

import { useEffect, useState, useMemo } from 'react';
import { FileText, Loader2 } from 'lucide-react';
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
  jugador: { id: string; nombre: string; dni: string; categoria_id: string | null; peso_kg: number | null };
  periodo: { desde: string; hasta: string };
  asistencia: { diasPresente: number; totalDias: number; porcentaje: number; fechas: string[] };
  wellness?: {
    sesiones: { fecha: string; score: number; respuestas: Record<string, number> }[];
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
  metricas: {
    pesoCorporalKg: number | null;
    rmRelativaPorEjercicio: Record<string, number | null> | null;
  };
  volumenSemanal?: { semana: string; volumen: number }[];
};

const PERIODOS = [
  { value: '30', label: '30 días' },
  { value: '90', label: '90 días' },
  { value: '180', label: '6 meses' },
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

/** Epley: 1RM estimado a partir de peso × reps */
function epley1RM(peso: number, reps: number): number {
  if (reps <= 0) return peso;
  return peso * (1 + reps / 30);
}

export interface RendimientoClientProps {
  jugadorId: string;
  jugadorNombre: string;
  categoriaNombre: string | null;
  /** Si false, no se muestra el botón de generar reporte PDF (feature flag). */
  reportePdfHabilitado?: boolean;
}

export default function RendimientoClient({
  jugadorId,
  jugadorNombre,
  categoriaNombre,
  reportePdfHabilitado = true,
}: RendimientoClientProps) {
  const [periodo, setPeriodo] = useState('30');
  const [data, setData] = useState<RendimientoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pesoInput, setPesoInput] = useState<string>('');
  const [pesoSaving, setPesoSaving] = useState(false);
  const [pesoError, setPesoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/staff/jugadores/${jugadorId}/rendimiento?periodo=${periodo}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar rendimiento');
        return res.json();
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setPesoInput(d.jugador.peso_kg != null ? String(d.jugador.peso_kg) : '');
        }
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
  }, [jugadorId, periodo]);

  const guardarPeso = async () => {
    const valor = pesoInput.trim() === '' ? null : parseFloat(pesoInput.replace(',', '.'));
    if (valor !== null && (Number.isNaN(valor) || valor < 20 || valor > 300)) {
      setPesoError('Ingresá un peso entre 20 y 300 kg.');
      return;
    }
    setPesoError(null);
    setPesoSaving(true);
    try {
      const res = await fetch(`/api/staff/jugadores/${jugadorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peso_kg: valor }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Error al guardar');
      }
      const { jugador } = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              jugador: { ...prev.jugador, peso_kg: jugador.peso_kg ?? null },
              metricas: {
                ...prev.metricas,
                pesoCorporalKg: jugador.peso_kg ?? null,
                rmRelativaPorEjercicio:
                  jugador.peso_kg != null
                    ? Object.fromEntries(
                        Object.entries(prev.ejercicios).map(([id, ej]) => [
                          id,
                          ej.pesoMax > 0 ? Math.round((ej.pesoMax / jugador.peso_kg) * 100) / 100 : null,
                        ])
                      )
                    : null,
              },
            }
          : null
      );
    } catch (e) {
      setPesoError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setPesoSaving(false);
    }
  };

  const generarReporte = () => {
    if (!data) return;
    const html = buildReporteHTML(data, jugadorNombre);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Permití ventanas emergentes para abrir el reporte.');
      return;
    }
    win.document.write(html);
    win.document.close();
  };

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

  const progresoUltimoMes = useMemo(() => {
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
    const list = [...data.registros]
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.timestamp.localeCompare(a.timestamp))
      .slice(0, 50)
      .map((r) => ({
        fecha: r.fecha,
        ejercicio: data.ejercicios[r.ejercicio_id]?.nombre ?? r.ejercicio_id,
        peso: r.peso,
        reps: r.reps,
        rpeSesion: rpePorFecha.get(r.fecha) ?? null,
      }));
    return list;
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
    <>
      {/* 3.1 Header del Jugador – fondo sutil, nombre grande, botón PDF */}
      <header className="rounded-2xl bg-white shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{jugadorNombre}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {categoriaNombre ?? 'Sin categoría'}
              <span className="ml-2 text-gray-400">· Activo</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatFecha(data.periodo.desde)} – {formatFecha(data.periodo.hasta)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {PERIODOS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriodo(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    periodo === p.value
                      ? 'bg-sanmartin-red text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {reportePdfHabilitado && (
              <button
                type="button"
                onClick={generarReporte}
                className="flex items-center gap-2 px-4 py-2 bg-sanmartin-red text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
              >
                <FileText size={18} />
                Generar reporte PDF
              </button>
            )}
          </div>
        </div>

        {/* Peso corporal compacto */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Peso corporal (kg):</span>
          <input
            type="number"
            min={20}
            max={300}
            step={0.5}
            placeholder="Opcional"
            value={pesoInput}
            onChange={(e) => setPesoInput(e.target.value)}
            className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
          />
          <button
            type="button"
            onClick={guardarPeso}
            disabled={pesoSaving}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {pesoSaving ? 'Guardando…' : 'Guardar'}
          </button>
          {pesoError && <span className="text-xs text-red-600">{pesoError}</span>}
        </div>
      </header>

      {/* Barra de asistencia: días presentes / total, porcentaje (C.1.2) */}
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

      {/* 3.2 Bloque 1 – Métricas principales (6 cards: asistencia, RM, progreso, sesiones, wellness, RPE) */}
      <StatsGrid>
        <StatCard
          label="Asistencia"
          value={`${data.asistencia.porcentaje}%`}
          sublabel={`Últimos ${periodo} días`}
        />
        <StatCard
          label="Último RM estimado"
          value={ultimoRMEstimado != null ? `${ultimoRMEstimado} kg` : '—'}
          sublabel="Mejor serie (Epley)"
        />
        <StatCard
          label="Progreso último mes"
          value={progresoUltimoMes != null ? `${progresoUltimoMes > 0 ? '+' : ''}${progresoUltimoMes}%` : '—'}
          sublabel="Peso máx. 2ª mitad vs 1ª"
        />
        <StatCard
          label="Total sesiones completadas"
          value={data.asistencia.diasPresente}
          sublabel={`de ${data.asistencia.totalDias} días`}
        />
        <StatCard
          label="Wellness promedio (cuestionario)"
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

      {/* 4. Bloque 2 – Evolución (gráfico peso en el tiempo) */}
      {chartEvolucionGlobal.length > 0 && (
        <section className="rounded-2xl bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Evolución del peso en el tiempo
          </h2>
          <PerformanceChart data={chartEvolucionGlobal} />
        </section>
      )}

      {/* Volumen semanal (tonelaje Σ peso×reps por semana) */}
      {data.volumenSemanal && data.volumenSemanal.length > 0 && (
        <section className="rounded-2xl bg-white shadow-sm p-6 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Carga semanal (tonelaje)
          </h2>
          <p className="text-xs text-gray-400 mb-4">Suma de peso × repeticiones por semana (kg totales).</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-2 pr-4">Semana</th>
                  <th className="pb-2 text-right">Volumen (kg)</th>
                  <th className="pb-2 pl-4">Barra</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const maxVol = Math.max(...(data.volumenSemanal?.map((v) => v.volumen) ?? [1]));
                  return data.volumenSemanal?.map((item) => (
                    <tr key={item.semana} className="border-b border-gray-50">
                      <td className="py-2 pr-4 text-gray-700">
                        {new Date(item.semana + 'T12:00:00').toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </td>
                      <td className="py-2 text-right font-bold text-sanmartin-red">
                        {item.volumen.toLocaleString('es-AR')}
                      </td>
                      <td className="py-2 pl-4 w-40">
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sanmartin-red rounded-full"
                            style={{ width: `${maxVol > 0 ? Math.round((item.volumen / maxVol) * 100) : 0}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Bienestar (wellness) y RPE por fecha */}
      {bienestarPorFecha.length > 0 && (
        <section className="rounded-2xl bg-white shadow-sm overflow-hidden border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide p-4 pb-0">
            Bienestar y esfuerzo por fecha
          </h2>
          <p className="text-xs text-gray-400 px-4 pt-1 pb-3">
            Cuestionario wellness (0-25) y RPE de sesión (1-10) al finalizar la jornada.
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

      {/* 4.2 RM / Mejor ejercicio – número grande + sparkline */}
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

      {/* 5. Bloque 3 – Tabla comparativa (Fecha | Ejercicio | Peso | Reps) */}
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
                    <td className="py-2.5 px-4 text-right font-medium text-sanmartin-red">{r.peso} kg</td>
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
    </>
  );
}

function buildReporteHTML(data: RendimientoData, jugadorNombre: string): string {
  const periodoTexto = `${formatFecha(data.periodo.desde)} – ${formatFecha(data.periodo.hasta)}`;
  const ejerciciosOrdenados = Object.entries(data.ejercicios).sort(
    (a, b) => b[1].pesoMax - a[1].pesoMax
  );
  const ejerciciosRows = ejerciciosOrdenados
    .map(([id, ej]) => {
      const rm = data.metricas.rmRelativaPorEjercicio?.[id];
      return `
        <tr>
          <td>${ej.nombre}</td>
          <td>${ej.pesoMax} kg</td>
          <td>${ej.mejorSerie.peso} × ${ej.mejorSerie.reps}${ej.mejorSerie.fecha ? ` (${formatFecha(ej.mejorSerie.fecha)})` : ''}</td>
          <td>${rm != null ? rm.toFixed(2) : '—'}</td>
        </tr>`;
    })
    .join('');

  const maxPeso = Math.max(1, ...ejerciciosOrdenados.map(([, ej]) => ej.pesoMax));
  const barWidth = 180;
  const barHeight = 20;
  const gap = 8;
  const chartBars = ejerciciosOrdenados
    .map(([, ej], i) => {
      const w = maxPeso > 0 ? (ej.pesoMax / maxPeso) * barWidth : 0;
      const y = i * (barHeight + gap);
      const label = ej.nombre.length > 22 ? ej.nombre.slice(0, 20) + '…' : ej.nombre;
      return `
        <g>
          <text x="0" y="${y + 14}" font-size="11" fill="#333">${escapeHtml(label)}</text>
          <rect x="200" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="#eee"/>
          <rect x="200" y="${y}" width="${w}" height="${barHeight}" rx="4" fill="#E31E24"/>
          <text x="${205 + w}" y="${y + 14}" font-size="10" fill="#333" font-weight="600">${ej.pesoMax} kg</text>
        </g>`;
    })
    .join('');

  const svgBarsHeight = ejerciciosOrdenados.length * (barHeight + gap) + 4;

  const fechasConPeso: { fecha: string; peso: number }[] = [];
  const fechasSet = new Set<string>();
  ejerciciosOrdenados.forEach(([, ej]) => {
    ej.porFecha.forEach((p) => fechasSet.add(p.fecha));
  });
  const fechasOrdenadas = Array.from(fechasSet).sort();
  fechasOrdenadas.forEach((fecha) => {
    let peso = 0;
    ejerciciosOrdenados.forEach(([, ej]) => {
      const p = ej.porFecha.find((x) => x.fecha === fecha);
      if (p && p.pesoMax > peso) peso = p.pesoMax;
    });
    fechasConPeso.push({ fecha, peso });
  });

  const maxPesoLinea = Math.max(1, ...fechasConPeso.map((d) => d.peso));
  const lineW = 520;
  const lineH = 220;
  const pad = { left: 44, right: 24, top: 16, bottom: 32 };
  const innerW = lineW - pad.left - pad.right;
  const innerH = lineH - pad.top - pad.bottom;
  const yTicks = 5;
  const yStep = maxPesoLinea / (yTicks - 1);
  const yAxisLabels = Array.from({ length: yTicks }, (_, i) => {
    const kg = Math.round(maxPesoLinea - i * yStep);
    const y = pad.top + (i / (yTicks - 1)) * innerH;
    return `<text x="${pad.left - 8}" y="${y + 4}" font-size="10" fill="#555" text-anchor="end">${kg}</text>`;
  }).join('');
  const gridLines = Array.from({ length: yTicks - 1 }, (_, i) => {
    if (i === 0) return '';
    const y = pad.top + (i / (yTicks - 1)) * innerH;
    return `<line x1="${pad.left}" y1="${y}" x2="${pad.left + innerW}" y2="${y}" stroke="#eee" stroke-width="1"/>`;
  }).join('');
  let pathD = '';
  let pointsD = '';
  let dataLabels = '';
  if (fechasConPeso.length > 0) {
    const stepX = fechasConPeso.length > 1 ? innerW / (fechasConPeso.length - 1) : 0;
    fechasConPeso.forEach((d, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + innerH - (d.peso / maxPesoLinea) * innerH;
      pathD += (i === 0 ? 'M' : 'L') + `${x} ${y}`;
      pointsD += `<circle cx="${x}" cy="${y}" r="5" fill="#E31E24" stroke="#fff" stroke-width="2"/>`;
      dataLabels += `<text x="${x}" y="${y - 10}" font-size="9" fill="#333" text-anchor="middle" font-weight="600">${d.peso}</text>`;
    });
  }
  const lineLabels =
    fechasConPeso.length > 0
      ? fechasConPeso
          .map((d, i) => {
            const stepX = fechasConPeso.length > 1 ? innerW / (fechasConPeso.length - 1) : 0;
            const x = pad.left + i * stepX;
            const short = d.fecha.slice(8) + '/' + d.fecha.slice(5, 7);
            return `<text x="${x}" y="${lineH - 8}" font-size="9" fill="#666" text-anchor="middle">${short}</text>`;
          })
          .join('')
      : '';

  let ultimoRM = 0;
  ejerciciosOrdenados.forEach(([, ej]) => {
    const { peso, reps } = ej.mejorSerie;
    if (peso > 0 && reps > 0) {
      const rm = epley1RM(peso, reps);
      if (rm > ultimoRM) ultimoRM = rm;
    }
  });
  ultimoRM = Math.round(ultimoRM * 10) / 10;

  const wellnessPromedio = data.wellness?.promedioScore ?? null;
  const rpePromedio = data.rpe?.promedioRpe ?? null;
  const bienestarRows =
    data.wellness?.sesiones?.length || data.rpe?.sesiones?.length
      ? (() => {
          const fechasSet = new Set([
            ...(data.wellness?.sesiones?.map((s) => s.fecha) ?? []),
            ...(data.rpe?.sesiones?.map((s) => s.fecha) ?? []),
          ]);
          return Array.from(fechasSet)
            .sort()
            .reverse()
            .slice(0, 30)
            .map((fecha) => {
              const w = data.wellness?.sesiones?.find((s) => s.fecha === fecha);
              const r = data.rpe?.sesiones?.find((s) => s.fecha === fecha);
              if (!w && !r) return null;
              return `<tr><td>${formatFecha(fecha)}</td><td style="text-align:right">${w != null ? w.score + '/25' : '—'}</td><td style="text-align:right">${r != null ? r.rpe : '—'}</td></tr>`;
            })
            .filter(Boolean)
            .join('');
        })()
      : '';

  const bienestarSectionHTML =
    bienestarRows.length > 0
      ? `
  <section>
    <h2>Bienestar y esfuerzo por fecha</h2>
    <p style="font-size: 0.8rem; color: #6b7280; margin-bottom: 8px;">Wellness (0-25) y RPE de sesión (1-10).</p>
    <table>
      <thead><tr><th>Fecha</th><th style="text-align:right">Wellness</th><th style="text-align:right">RPE sesión</th></tr></thead>
      <tbody>${bienestarRows}</tbody>
    </table>
  </section>`
      : '';

  const kpiCards = `
  <div class="reporte-kpi-grid">
    <div class="reporte-kpi-card">
      <span class="reporte-kpi-label">Asistencia</span>
      <span class="reporte-kpi-value">${data.asistencia.porcentaje}%</span>
      <span class="reporte-kpi-sublabel">${data.asistencia.diasPresente} de ${data.asistencia.totalDias} días</span>
    </div>
    <div class="reporte-kpi-card">
      <span class="reporte-kpi-label">Último RM estimado</span>
      <span class="reporte-kpi-value">${ultimoRM > 0 ? ultimoRM + ' kg' : '—'}</span>
    </div>
    <div class="reporte-kpi-card">
      <span class="reporte-kpi-label">Total sesiones</span>
      <span class="reporte-kpi-value">${data.asistencia.diasPresente}</span>
      <span class="reporte-kpi-sublabel">de ${data.asistencia.totalDias} días</span>
    </div>
    <div class="reporte-kpi-card">
      <span class="reporte-kpi-label">Ejercicios con registros</span>
      <span class="reporte-kpi-value">${ejerciciosOrdenados.length}</span>
    </div>
    <div class="reporte-kpi-card">
      <span class="reporte-kpi-label">Wellness promedio</span>
      <span class="reporte-kpi-value">${wellnessPromedio != null ? wellnessPromedio + '/25' : '—'}</span>
      <span class="reporte-kpi-sublabel">${data.wellness?.diasCompletados ?? 0} días con cuestionario</span>
    </div>
    <div class="reporte-kpi-card">
      <span class="reporte-kpi-label">RPE promedio (sesión)</span>
      <span class="reporte-kpi-value">${rpePromedio != null ? rpePromedio + ' (1-10)' : '—'}</span>
      <span class="reporte-kpi-sublabel">${data.rpe?.diasConRpe ?? 0} sesiones con RPE</span>
    </div>
  </div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reporte de rendimiento – ${escapeHtml(jugadorNombre)}</title>
  <style>
    :root { --sanmartin-red: #E31E24; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1a1a1a; max-width: 720px; margin: 0 auto; background: #f9fafb; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 24px; }
    .reporte-kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
    @media (min-width: 520px) { .reporte-kpi-grid { grid-template-columns: repeat(4, 1fr); } }
    .reporte-kpi-card { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .reporte-kpi-label { display: block; font-size: 0.7rem; font-weight: 600; color: #6b7280; }
    .reporte-kpi-value { display: block; font-size: 1.5rem; font-weight: 700; color: var(--sanmartin-red); margin-top: 2px; }
    .reporte-kpi-sublabel { display: block; font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }
    section { margin-bottom: 24px; }
    h2 { font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    th { color: #6b7280; font-weight: 600; }
    .chart-container { margin: 12px 0; overflow-x: auto; }
    .chart-container svg { display: block; }
    .no-print { margin-top: 24px; }
    @media print { .no-print { display: none !important; } body { background: #fff; } }
  </style>
</head>
<body>
  <h1>Reporte de rendimiento</h1>
  <p class="meta">${escapeHtml(jugadorNombre)} · Período: ${escapeHtml(periodoTexto)}</p>

  ${kpiCards}
  ${bienestarSectionHTML}

  <section>
    <h2>Gráfico: Peso máximo por ejercicio</h2>
    <div class="chart-container">
      <svg width="420" height="${svgBarsHeight}" viewBox="0 0 420 ${svgBarsHeight}">
        ${chartBars}
      </svg>
    </div>
  </section>

  <section>
    <h2>Evolución del peso en el tiempo</h2>
    <div class="chart-container">
      <svg width="${lineW}" height="${lineH}" viewBox="0 0 ${lineW} ${lineH}">
        ${gridLines}
        ${pathD ? `<path d="${pathD}" fill="none" stroke="#E31E24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
        ${pointsD}
        ${dataLabels}
        <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + innerH}" stroke="#e5e7eb" stroke-width="1"/>
        <line x1="${pad.left}" y1="${pad.top + innerH}" x2="${pad.left + innerW}" y2="${pad.top + innerH}" stroke="#e5e7eb" stroke-width="1"/>
        ${yAxisLabels}
        ${lineLabels}
      </svg>
    </div>
  </section>

  <section>
    <h2>Rendimiento por ejercicio</h2>
    <table>
      <thead>
        <tr><th>Ejercicio</th><th>Peso máx.</th><th>Mejor serie</th><th>RM rel.</th></tr>
      </thead>
      <tbody>${ejerciciosRows}</tbody>
    </table>
  </section>

  <div class="no-print">
    <button type="button" onclick="window.print();" style="padding: 10px 20px; background: var(--sanmartin-red); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Imprimir / Guardar como PDF</button>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (c) => map[c] ?? c);
}
