/**
 * Card de métrica: número grande + label pequeño (estilo video referencia).
 * SPEC: rounded-2xl, shadow-sm, número text-3xl/4xl, label pequeño, mucho espacio.
 */

export default function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <h2 className="text-3xl font-bold text-sanmartin-red mt-1">{value}</h2>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}
