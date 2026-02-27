import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUsuarioByDni } from '@/lib/redis';

vi.mock('@/lib/redis', () => ({
  getUsuarioByDni: vi.fn(),
}));

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve 401 cuando el usuario no existe', async () => {
    vi.mocked(getUsuarioByDni).mockResolvedValue(null);
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ dni: '45123456' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Usuario no encontrado o inactivo');
  });

  it('devuelve 401 cuando el usuario está inactivo', async () => {
    vi.mocked(getUsuarioByDni).mockResolvedValue({
      id: 'u1',
      dni: '45123456',
      nombre: 'Juan',
      rol: 'jugador',
      activo: false,
    });
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ dni: '45123456' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Usuario no encontrado o inactivo');
  });

  it('devuelve 200 y usuario con cookie auth_token cuando el usuario existe y está activo', async () => {
    const usuario = {
      id: 'user-jugador-1',
      dni: '45123456',
      nombre: 'Juan Pérez',
      rol: 'jugador' as const,
      activo: true,
    };
    vi.mocked(getUsuarioByDni).mockResolvedValue(usuario);
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ dni: '45123456' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.usuario).toEqual(usuario);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('auth_token=');
  });

  it('devuelve 400 cuando el body no tiene DNI válido', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Error en el login');
  });
});
