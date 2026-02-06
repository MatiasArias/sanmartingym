'use client';

import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Award, FileText, Loader2 } from 'lucide-react';
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
  ejercicios: Record<string, EjercicioRendimiento>;
  registros: RegistroCarga[];
  metricas: {
    pesoCorporalKg: number | null;
    rmRelativaPorEjercicio: Record<string, number | null> | null;
  };
};

const PERIODOS = [
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '180', label: 'Últimos 6 meses' },
];

function formatFecha(fecha: string) {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function RendimientoClient({
  jugadorId,
  jugadorNombre,
}: {
  jugadorId: string;
  jugadorNombre: string;
}) {
  const [periodo, setPeriodo] = useState('30');
  const [data, setData] = useState<RendimientoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ejercicioExpandido, setEjercicioExpandido] = useState<string | null>(null);
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sanmartin-red" />
      </div>
    );
  }

  const ejerciciosList = Object.entries(data.ejercicios).sort(
    (a, b) => b[1].pesoMax - a[1].pesoMax
  );

  return (
    <div className="space-y-4">
      {/* Peso corporal */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Peso corporal (kg)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Se usa para calcular la RM relativa en el reporte. Opcional.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={20}
            max={300}
            step={0.5}
            placeholder="Ej: 75"
            value={pesoInput}
            onChange={(e) => setPesoInput(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanmartin-red focus:border-transparent"
          />
          <span className="text-gray-500 text-sm">kg</span>
          <button
            type="button"
            onClick={guardarPeso}
            disabled={pesoSaving}
            className="px-4 py-2 bg-sanmartin-red text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {pesoSaving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        {pesoError && (
          <p className="mt-2 text-sm text-red-600">{pesoError}</p>
        )}
      </div>

      {/* Selector de período */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Período
        </label>
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriodo(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                periodo === p.value
                  ? 'bg-sanmartin-red text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {formatFecha(data.periodo.desde)} – {formatFecha(data.periodo.hasta)}
        </p>
      </div>

      {/* Barra de asistencia */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h2 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
          <Calendar size={18} />
          Asistencia
        </h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sanmartin-red rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, data.asistencia.porcentaje)}%`,
                }}
              />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {data.asistencia.diasPresente} / {data.asistencia.totalDias} días ·{' '}
            <span
              className={
                data.asistencia.porcentaje >= 70
                  ? 'text-green-600'
                  : data.asistencia.porcentaje >= 40
                    ? 'text-amber-600'
                    : 'text-red-600'
              }
            >
              {data.asistencia.porcentaje}%
            </span>
          </div>
        </div>
      </div>

      {/* Resumen por ejercicio y línea de tiempo */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
          <h2 className="flex items-center gap-2 font-bold text-gray-900">
            <TrendingUp size={18} />
            Rendimiento por ejercicio
          </h2>
          <button
            type="button"
            onClick={generarReporte}
            className="flex items-center gap-2 px-4 py-2 bg-sanmartin-red text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            <FileText size={16} />
            Generar reporte
          </button>
        </div>

        {ejerciciosList.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No hay registros de carga en este período.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ejerciciosList.map(([ejId, ej]) => {
              const expandido = ejercicioExpandido === ejId;
              const rmRelativa = data.metricas.rmRelativaPorEjercicio?.[ejId];
              return (
                <div key={ejId} className="p-4">
                  <button
                    type="button"
                    onClick={() =>
                      setEjercicioExpandido(expandido ? null : ejId)
                    }
                    className="w-full text-left flex items-center justify-between gap-2"
                  >
                    <span className="font-medium text-gray-900">{ej.nombre}</span>
                    <span className="text-sanmartin-red font-semibold">
                      {ej.pesoMax} kg máx
                      {rmRelativa != null && (
                        <span className="text-gray-500 font-normal ml-1">
                          · RM rel. {rmRelativa.toFixed(2)}
                        </span>
                      )}
                    </span>
                  </button>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Award size={12} />
                      Mejor serie: {ej.mejorSerie.peso} kg × {ej.mejorSerie.reps} reps
                      {ej.mejorSerie.fecha && ` (${formatFecha(ej.mejorSerie.fecha)})`}
                    </span>
                  </div>
                  {expandido && ej.porFecha.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Peso máximo por fecha
                      </p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {ej.porFecha.map(({ fecha, pesoMax }) => (
                          <div
                            key={fecha}
                            className="flex justify-between text-sm text-gray-700"
                          >
                            <span>{formatFecha(fecha)}</span>
                            <span className="font-medium">{pesoMax} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
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

  const tipoLabels: Record<string, string> = {
    empuje: 'Empuje',
    traccion: 'Tracción',
    movilidad: 'Movilidad',
  };
  const tipoColors: Record<string, string> = {
    empuje: '#E31E24',
    traccion: '#1a5fb4',
    movilidad: '#26a269',
  };
  const porTipo: Record<string, number> = { empuje: 0, traccion: 0, movilidad: 0 };
  ejerciciosOrdenados.forEach(([, ej]) => {
    const t = ej.tipo ?? 'empuje';
    porTipo[t] = (porTipo[t] ?? 0) + ej.registros.length;
  });
  const totalRegistros = Object.values(porTipo).reduce((a, b) => a + b, 0);
  const pieSlices =
    totalRegistros > 0
      ? (() => {
          const cx = 120;
          const cy = 100;
          const r = 82;
          let startAngleDeg = 90;
          const slices: string[] = [];
          (['empuje', 'traccion', 'movilidad'] as const).forEach((t) => {
            const count = porTipo[t] ?? 0;
            if (count === 0) return;
            const pct = (count / totalRegistros) * 100;
            const angleDeg = (pct / 100) * 360;
            const endAngleDeg = startAngleDeg - angleDeg;
            const steps = Math.max(2, Math.ceil(angleDeg / 4));
            const points: string[] = [`${cx} ${cy}`];
            for (let i = 0; i <= steps; i++) {
              const a = ((startAngleDeg - (i / steps) * angleDeg) * Math.PI) / 180;
              const x = cx + r * Math.cos(a);
              const y = cy - r * Math.sin(a);
              points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
            }
            slices.push(
              `<path d="M ${points.join(' L ')} Z" fill="${tipoColors[t]}" stroke="#fff" stroke-width="2"/>`
            );
            startAngleDeg = endAngleDeg;
          });
          return slices.join('');
        })()
      : '';
  const pieLegend =
    totalRegistros > 0
      ? (['empuje', 'traccion', 'movilidad'] as const)
          .filter((t) => (porTipo[t] ?? 0) > 0)
          .map((t) => {
            const count = porTipo[t] ?? 0;
            const pct = Math.round((count / totalRegistros) * 100);
            return `<tr><td><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${tipoColors[t]};margin-right:6px;"></span>${tipoLabels[t]}</td><td style="text-align:right">${count} reg.</td><td style="text-align:right">${pct}%</td></tr>`;
          })
          .join('')
      : '<tr><td colspan="3" style="color:#666">Sin registros en el período</td></tr>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Reporte de rendimiento – ${jugadorNombre}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1a1a1a; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 24px; }
    section { margin-bottom: 24px; }
    h2 { font-size: 1rem; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; }
    th { color: #666; font-weight: 600; }
    .asistencia-bar { height: 20px; background: #eee; border-radius: 10px; overflow: hidden; margin: 8px 0; }
    .asistencia-fill { height: 100%; background: #E31E24; border-radius: 10px; }
    .chart-container { margin: 12px 0; overflow-x: auto; }
    .chart-container svg { display: block; }
    .no-print { margin-top: 24px; }
    @media print { .no-print { display: none !important; } }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Reporte de rendimiento</h1>
  <p class="meta">${jugadorNombre} · Período: ${periodoTexto}</p>

  <section>
    <h2>Asistencia</h2>
    <p>${data.asistencia.diasPresente} de ${data.asistencia.totalDias} días (${data.asistencia.porcentaje}%)</p>
    <div class="asistencia-bar">
      <div class="asistencia-fill" style="width: ${Math.min(100, data.asistencia.porcentaje)}%;"></div>
    </div>
  </section>

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
    <p style="font-size: 0.8rem; color: #666; margin-bottom: 8px;">Peso máximo (kg) registrado por fecha — cualquier ejercicio. Eje Y: kg.</p>
    <div class="chart-container">
      <svg width="${lineW}" height="${lineH}" viewBox="0 0 ${lineW} ${lineH}">
        ${gridLines}
        ${pathD ? `<path d="${pathD}" fill="none" stroke="#E31E24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
        ${pointsD}
        ${dataLabels}
        <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + innerH}" stroke="#ccc" stroke-width="1"/>
        <line x1="${pad.left}" y1="${pad.top + innerH}" x2="${pad.left + innerW}" y2="${pad.top + innerH}" stroke="#ccc" stroke-width="1"/>
        ${yAxisLabels}
        ${lineLabels}
      </svg>
    </div>
  </section>

  <section>
    <h2>Distribución por tipo de ejercicio</h2>
    <p style="font-size: 0.8rem; color: #666; margin-bottom: 8px;">Porcentaje de registros de carga (series) por tipo de ejercicio en el período.</p>
    <div class="chart-container" style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px;">
      <svg width="240" height="200" viewBox="0 0 240 200">
        ${pieSlices}
      </svg>
      <table style="font-size: 0.875rem; border-collapse: collapse;">
        <thead><tr><th style="text-align:left;padding:4px 8px;">Tipo</th><th style="text-align:right;padding:4px 8px;">Registros</th><th style="text-align:right;padding:4px 8px;">%</th></tr></thead>
        <tbody>${pieLegend}</tbody>
      </table>
    </div>
  </section>

  <section>
    <h2>Rendimiento por ejercicio (tabla)</h2>
    <table>
      <thead>
        <tr><th>Ejercicio</th><th>Peso máx.</th><th>Mejor serie</th><th>RM relativa</th></tr>
      </thead>
      <tbody>${ejerciciosRows}</tbody>
    </table>
    ${data.metricas.pesoCorporalKg ? `<p style="font-size: 0.75rem; color: #666; margin-top: 8px;">RM relativa = peso máximo / peso corporal (${data.metricas.pesoCorporalKg} kg).</p>` : '<p style="font-size: 0.75rem; color: #666; margin-top: 8px;">Peso corporal no registrado; RM relativa no calculada.</p>'}
  </section>

  <div class="no-print">
    <button type="button" onclick="window.print();" style="padding: 10px 20px; background: #E31E24; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Imprimir / Guardar como PDF</button>
  </div>
  <script>
    window.onload = function() {
      var btn = document.querySelector('button');
      if (btn) btn.focus();
    };
  </script>
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
