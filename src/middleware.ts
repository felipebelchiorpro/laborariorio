
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/', '/sao-joao'];
const UBS_ROUTES = ['/consulta'];
const LOGIN_ROUTE = '/login';

// Todas as rotas, exceto a de login, são consideradas protegidas
const PROTECTED_ROUTES = [...ADMIN_ROUTES, ...UBS_ROUTES];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('lab_session');
  const sessionRole = sessionCookie?.value as 'admin' | 'ubs' | undefined;

  const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);

  // 1. Se o usuário não está logado e tenta acessar uma rota protegida
  if (!sessionRole && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_ROUTE;
    return NextResponse.redirect(url);
  }

  // 2. Se o usuário está logado
  if (sessionRole) {
    // Se tentar acessar a página de login, redirecione para o painel apropriado
    if (pathname === LOGIN_ROUTE) {
      const targetPath = sessionRole === 'admin' ? '/' : '/consulta';
      const url = request.nextUrl.clone();
      url.pathname = targetPath;
      return NextResponse.redirect(url);
    }

    // Se um usuário da UBS tentar acessar uma rota de admin, redirecione
    if (sessionRole === 'ubs' && ADMIN_ROUTES.includes(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = '/consulta';
        return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any file with an extension (e.g. .png, .jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
