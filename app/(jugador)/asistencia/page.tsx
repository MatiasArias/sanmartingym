'use client';

import { useState, useEffect } from 'react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type CalendarioData = {
  mes: number;
  anio: number;
  asistencias: string[];
  diasPartido: string[];
};

function getDiasDelMes(anio: number, mes: number): { date: Date; fechaStr: string }[] {
  const ultimo = new Date(anio, mes, 0).getDate();
  const dias: { date: Date; fechaStr: string }[] = [];
  for (let d = 1; d <= ultimo; d++) {
    const fechaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dias.push({ date: new Date(anio, mes - 1, d), fechaStr });
  }
  return dias;
}

/** Primer día del mes (0=domingo) y cuántos días del mes anterior rellenar */
function getOffsetPrimerDia(anio: number, mes: number): number {
  return new Date(anio, mes - 1, 1).getDay();
}

export default function AsistenciaPage() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [data, setData] = useState<CalendarioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/asistencia?mes=${mes}&anio=${anio}`)
      .then((res) => res.json())
      .then((d) => {
        setData({
          mes: d.mes ?? mes,
          anio: d.anio ?? anio,
          asistencias: Array.isArray(d.asistencias) ? d.asistencias : [],
          diasPartido: Array.isArray(d.diasPartido) ? d.diasPartido : [],
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [mes, anio]);

  const anterior = () => {
    if (mes === 1) {
      setMes(12);
      setAnio((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  };

  const siguiente = () => {
    if (mes === 12) {
      setMes(1);
      setAnio((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  };

  const diasDelMes = getDiasDelMes(anio, mes);
  const offset = getOffsetPrimerDia(anio, mes);
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const esPartido = (fechaStr: string) => data?.diasPartido.includes(fechaStr) ?? false;
  const asistio = (fechaStr: string) => data?.asistencias.includes(fechaStr) ?? false;

  const claseDia = (fechaStr: string) => {
    const partido = esPartido(fechaStr);
    const presente = asistio(fechaStr);
    if (partido && !presente) return 'bg-red-500 text-white'; // partido, no asistió
    if (presente) return 'bg-green-500 text-white'; // asistió
    if (partido) return 'bg-blue-500 text-white';  // partido (futuro o sin marcar aún)
    return 'bg-gray-100 text-gray-600';            // día normal
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Asistencia</h1>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={anterior}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            aria-label="Mes anterior"
          >
            ←
          </button>
          <span className="font-semibold text-gray-900">
            {MESES[mes - 1]} {anio}
          </span>
          <button
            type="button"
            onClick={siguiente}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            aria-label="Mes siguiente"
          >
            →
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Cargando...</div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DIAS_SEMANA.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-gray-500 py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }, (_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {diasDelMes.map(({ date: fecha, fechaStr }) => {
                const esHoy = fechaStr === hoyStr;
                return (
                  <div
                    key={fechaStr}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium ${claseDia(
                      fechaStr
                    )} ${esHoy ? 'ring-2 ring-gray-400 ring-offset-1' : ''}`}
                    title={
                      esPartido(fechaStr)
                        ? asistio(fechaStr)
                          ? 'Día de partido · Asistió'
                          : 'Día de partido · No asistió'
                        : asistio(fechaStr)
                          ? 'Asistió'
                          : ''
                    }
                  >
                    {fecha.getDate()}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-500" /> Día de partido
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500" /> Asistió
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500" /> Partido sin asistir
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
