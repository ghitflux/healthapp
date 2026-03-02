import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas — não exigem autenticação
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar assets e API routes internos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Rotas públicas — permitir sempre
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Verificar token no cookie (auth via cookie)
  const token = request.cookies.get('access_token')?.value;

  // Se não há token, verificar se há no header (fallback)
  // Para localStorage, o middleware não consegue acessar, então
  // o guard client-side cuida da autenticação nesses casos
  if (!token) {
    // Redirecionar para login apenas se acessar raiz ou rotas protegidas
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Para rotas /convenio/* e /owner/* sem cookie, deixar o client-side guard agir
    return NextResponse.next();
  }

  // Decodificar JWT
  const payload = decodeJWT(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }

  // Verificar expiração
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }

  const role = payload.role;

  // Redirect raiz baseado no role
  if (pathname === '/') {
    if (role === 'owner') {
      return NextResponse.redirect(new URL('/owner/dashboard', request.url));
    }
    if (role === 'convenio_admin') {
      return NextResponse.redirect(new URL('/convenio/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar acesso por role
  if (pathname.startsWith('/owner') && role !== 'owner') {
    return NextResponse.redirect(new URL('/convenio/dashboard', request.url));
  }

  if (
    pathname.startsWith('/convenio') &&
    !['convenio_admin', 'owner'].includes(role ?? '')
  ) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
