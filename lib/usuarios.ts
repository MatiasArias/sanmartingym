import { redis } from '@/lib/redis-client';

export interface Usuario {
  id: string;
  dni: string;
  nombre: string;
  rol: 'jugador' | 'staff';
  categoria_id?: string;
  fecha_nacimiento?: string;
  peso_kg?: number;
  activo: boolean;
}

export async function getUsuarioByDni(dni: string): Promise<Usuario | null> {
  return (await redis.get(`usuario:dni:${dni}`)) as Usuario | null;
}

export async function getUsuarioById(id: string): Promise<Usuario | null> {
  return (await redis.get(`usuario:${id}`)) as Usuario | null;
}

export async function createUsuario(usuario: Usuario): Promise<void> {
  await redis.set(`usuario:${usuario.id}`, usuario);
  await redis.set(`usuario:dni:${usuario.dni}`, usuario);
}

export async function updateUsuario(usuario: Usuario): Promise<void> {
  await redis.set(`usuario:${usuario.id}`, usuario);
  await redis.set(`usuario:dni:${usuario.dni}`, usuario);
}

export async function getAllUsuarios(): Promise<Usuario[]> {
  const keys = await redis.keys('usuario:user-*');
  const usuarios = (await Promise.all(keys.map((k) => redis.get(k)))) as (Usuario | null)[];
  return usuarios.filter(Boolean) as Usuario[];
}

export async function getJugadores(): Promise<Usuario[]> {
  const usuarios = await getAllUsuarios();
  return usuarios.filter((u) => u.rol === 'jugador');
}

export async function createJugador(data: {
  dni: string;
  nombre: string;
  categoria_id: string;
  fecha_nacimiento: string;
}): Promise<Usuario> {
  const existing = await getUsuarioByDni(data.dni);
  if (existing) throw new Error('Ya existe un usuario con ese DNI');

  const usuario: Usuario = {
    id: `user-jugador-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    dni: data.dni,
    nombre: data.nombre,
    rol: 'jugador',
    categoria_id: data.categoria_id,
    fecha_nacimiento: data.fecha_nacimiento,
    activo: true,
  };
  await createUsuario(usuario);
  return usuario;
}
