import { redis } from '@/lib/redis-client';

export interface EjercicioPlantilla {
  id: string;
  nombre: string;
  series_default: number;
  rir_default: number;
  repeticiones_default: number;
  tipo: 'empuje' | 'traccion' | 'movilidad';
  musculo_principal: string;
  modo_serie: 'serie_x_repeticion' | 'serie_x_minutos' | 'serie_x_brazo';
  ayuda_alumno: string;
}

export interface ConfigSemana {
  series: number;
  repeticiones?: number;
  rir: number;
  nota?: string;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function getAllPlantillasEjercicio(): Promise<EjercicioPlantilla[]> {
  const keys = await redis.keys('plantilla-ejercicio:*');
  const plantillas = (await Promise.all(keys.map((k) => redis.get(k)))) as (EjercicioPlantilla | null)[];
  return plantillas.filter(Boolean) as EjercicioPlantilla[];
}

export async function getPlantillaEjercicioById(id: string): Promise<EjercicioPlantilla | null> {
  return (await redis.get(`plantilla-ejercicio:${id}`)) as EjercicioPlantilla | null;
}

export async function createPlantillaEjercicio(
  data: Omit<EjercicioPlantilla, 'id'>
): Promise<EjercicioPlantilla> {
  const plantilla: EjercicioPlantilla = {
    ...data,
    id: generateId('plantilla-ej'),
  };
  await redis.set(`plantilla-ejercicio:${plantilla.id}`, plantilla);
  return plantilla;
}

export async function updatePlantillaEjercicio(plantilla: EjercicioPlantilla): Promise<void> {
  await redis.set(`plantilla-ejercicio:${plantilla.id}`, plantilla);
}

export async function deletePlantillaEjercicio(id: string): Promise<void> {
  await redis.del(`plantilla-ejercicio:${id}`);
}
