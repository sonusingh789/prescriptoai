import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import appConfig from '@/lib/config';

const COOKIE_NAME = 'prescriptoai_token';
const JWT_SECRET = new TextEncoder().encode(appConfig.auth.jwtSecret);

const publicPaths = ['/', '/login', '/signup'];
const doctorOnlyPaths = ['/record', '/conversations'];

function isPublic(pathname) {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isDoctorOnly(pathname) {
  return doctorOnlyPaths.some((p) => pathname.startsWith(p));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let payload = null;
  if (token) {
    try {
      const { payload: p } = await jwtVerify(token, JWT_SECRET);
      payload = p;
    } catch {
      payload = null;
    }
  }

  const isAuth = !!payload;
  const isDoctor = payload?.role === 'doctor';

  if (isAuth && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isAuth && !isPublic(pathname)) {
    const login = new URL('/login', request.url);
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }

  if (isAuth && isDoctorOnly(pathname) && !isDoctor) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
