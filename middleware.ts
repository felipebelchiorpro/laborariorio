
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/sao-joao'];
const LOGIN_ROUTE = '/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('lab_session');
  const isAuthenticated = sessionCookie?.value === 'true';

  const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);

  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_ROUTE;
    return NextResponse.redirect(url);
  }
  
  if (pathname === LOGIN_ROUTE && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Executar o middleware em todas as rotas, exceto as de assets,
  // para otimizar o desempenho.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
