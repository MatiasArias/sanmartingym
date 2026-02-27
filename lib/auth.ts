import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { jwtSecret } from '@/lib/config';

const secret = new TextEncoder().encode(jwtSecret);

export async function createToken(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
  return token;
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function getTokenPayload() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token');
  
  if (!token) return null;
  
  return await verifyToken(token.value);
}
