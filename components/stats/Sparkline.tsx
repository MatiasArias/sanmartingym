'use client';

/**
 * Mini gráfico de línea (sparkline). SPEC: número grande arriba, mini gráfico abajo.
 */

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export type SparklinePoint = { label: string; value: number };

export default function Sparkline({
  title,
  value,
  data,
  valueSuffix = '',
}: {
  title: string;
  value: string | number;
  data: SparklinePoint[];
  valueSuffix?: string;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-sanmartin-red mt-1">
        {value}
        {valueSuffix}
      </p>
      {data.length > 0 && (
        <div className="h-[64px] w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v: number | undefined) => [v ?? '–', '']}
                contentStyle={{ fontSize: 11, padding: '4px 8px' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#E31E24"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
