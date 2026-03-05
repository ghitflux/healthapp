import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/access-denied'];

interface JWTPayload {
  role?: string;
  exp?: number;
  user_id?: string;
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    return null;
  }
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

function isInternalAsset(pathname: string) {
  return pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/favicon');
}

function roleRedirect(role?: string | null) {
  if (role === 'owner') return '/owner/dashboard';
  if (role === 'convenio_admin') return '/convenio/dashboard';
  if (role === 'doctor') return '/access-denied?reason=doctor_web_pending&role=doctor';
  if (role === 'patient') return '/access-denied?reason=web_only&role=patient';
  return '/login';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isInternalAsset(pathname)) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;

  // Mantém compatibilidade com auth via localStorage no client.
  if (!token) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  const payload = decodeJWT(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }

  const role = payload.role ?? null;

  if (pathname === '/') {
    return NextResponse.redirect(new URL(roleRedirect(role), request.url));
  }

  if (pathname.startsWith('/owner') && role !== 'owner') {
    const deniedUrl = new URL('/access-denied', request.url);
    deniedUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(deniedUrl);
  }

  if (pathname.startsWith('/convenio') && !['convenio_admin', 'owner'].includes(role ?? '')) {
    const deniedUrl = new URL('/access-denied', request.url);
    deniedUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
