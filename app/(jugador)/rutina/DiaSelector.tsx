'use client';

import Link from 'next/link';

interface DiaSelectorProps {
  dias: string[];
  diaActual: string;
  /** Día de la semana actual para mostrar badge "Hoy" */
  diaHoy?: string;
}

export default function DiaSelector({ dias, diaActual, diaHoy }: DiaSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {dias.map((dia) => {
        const isActive = dia.toLowerCase() === diaActual.toLowerCase();
        const isHoy = diaHoy && dia.toLowerCase() === diaHoy.toLowerCase();
        return (
          <Link
            key={dia}
            href={`/rutina?dia=${dia}`}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition flex flex-col items-center min-w-[4rem] ${
              isActive
                ? 'bg-sanmartin-red text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>{dia.charAt(0).toUpperCase() + dia.slice(1)}</span>
            {isHoy && (
              <span className={`text-[10px] mt-0.5 ${isActive ? 'text-red-100' : 'text-gray-500'}`}>
                Hoy
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
