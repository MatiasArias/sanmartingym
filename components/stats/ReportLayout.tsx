/**
 * Estructura del reporte (pantalla o PDF): header → grid métricas → gráficos → tabla.
 * Usado como referencia para que buildReporteHTML mantenga la misma estructura.
 * Opcionalmente se puede usar renderToStaticMarkup(ReportLayout) para generar HTML.
 */

import type { ReactNode } from 'react';

export function ReportLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </header>
      <main className="p-6 space-y-6 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}

export function ReportSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}
