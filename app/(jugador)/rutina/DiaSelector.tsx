'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DiaSelectorProps {
  dias: string[];
  diaActual: string;
}

export default function DiaSelector({ dias, diaActual }: DiaSelectorProps) {
  const router = useRouter();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {dias.map((dia) => (
        <Link
          key={dia}
          href={`/rutina?dia=${dia}`}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
            dia.toLowerCase() === diaActual.toLowerCase()
              ? 'bg-sanmartin-red text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {dia.charAt(0).toUpperCase() + dia.slice(1)}
        </Link>
      ))}
    </div>
  );
}
