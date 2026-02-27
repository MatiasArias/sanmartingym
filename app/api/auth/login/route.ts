import { NextRequest, NextResponse } from 'next/server';
import { getUsuarioByDni } from '@/lib/redis';
import { createToken } from '@/lib/auth';
import { config } from '@/lib/config';
import { DNI_MIN_LENGTH, DNI_MAX_LENGTH } from '@/lib/constants';
import { z } from 'zod';

const loginSchema = z.object({
  dni: z.string().min(DNI_MIN_LENGTH).max(DNI_MAX_LENGTH),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dni } = loginSchema.parse(body);

    const usuario = await getUsuarioByDni(dni);

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: usuario.id,
      dni: usuario.dni,
      rol: usuario.rol,
    });

    const response = NextResponse.json({ usuario });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Error en el login' },
      { status: 400 }
    );
  }
}
