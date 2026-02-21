import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function getAuthFromRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export function requireDoctor(auth) {
  return auth && auth.role === 'doctor';
}
