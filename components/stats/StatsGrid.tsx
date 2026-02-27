/**
 * Grid de métricas principales. SPEC: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
 */

import { ReactNode } from 'react';

export default function StatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
