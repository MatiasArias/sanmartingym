'use client';

/**
 * Gráfico de líneas: peso en el tiempo. SPEC: línea limpia, sin grid exagerado, tooltips simples.
 * Recharts, stroke #E31E24 (sanmartin-red).
 */

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export type PerformanceChartPoint = {
  fecha: string;
  fechaLabel: string;
  peso: number;
};

export default function PerformanceChart({ data }: { data: PerformanceChartPoint[] }) {
  if (!data.length) return null;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="fechaLabel"
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(value: number | undefined) => [value != null ? `${value} kg` : '–', 'Peso']}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #eee',
              fontSize: 12,
            }}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fecha
                ? new Date(payload[0].payload.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : ''
            }
          />
          <Line
            type="monotone"
            dataKey="peso"
            stroke="#E31E24"
            strokeWidth={2}
            dot={{ fill: '#E31E24', r: 3 }}
            activeDot={{ r: 5, fill: '#E31E24' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
