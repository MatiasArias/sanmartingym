import { redis } from '@/lib/redis-client';

export interface Categoria {
  id: string;
  nombre: string;
}

export async function getAllCategorias(): Promise<Categoria[]> {
  const keys = await redis.keys('categoria:*');
  const categorias = (await Promise.all(keys.map((k) => redis.get(k)))) as (Categoria | null)[];
  return categorias.filter(Boolean) as Categoria[];
}

export async function createCategoria(data: { nombre: string }): Promise<Categoria> {
  const categorias = await getAllCategorias();
  const nombreNormalizado = data.nombre.trim();
  if (categorias.some((c) => c.nombre.toLowerCase() === nombreNormalizado.toLowerCase())) {
    throw new Error('Ya existe una categoría con ese nombre');
  }
  const id = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const categoria: Categoria = { id, nombre: nombreNormalizado };
  await redis.set(`categoria:${id}`, categoria);
  return categoria;
}
