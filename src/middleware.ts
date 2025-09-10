
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = "lab_session";

// As rotas que são acessíveis sem autenticação
const PUBLIC_ROUTES = ['/login'];
// As rotas que são protegidas e requerem autenticação
const PROTECTED_ROUTES_ADMIN = ['/', '/sao-joao'];
const PROTECTED_ROUTES_UBS = ['/consulta'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE_NAME);
  const sessionRole = session?.value;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Se o usuário não está logado e tenta acessar uma rota protegida
  if (!sessionRole && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se o usuário está logado
  if (sessionRole) {
    // E tenta acessar a página de login, redireciona para a página principal correspondente
    if (isPublicRoute) {
      const homeUrl = sessionRole === 'admin' ? '/' : '/consulta';
      return NextResponse.redirect(new URL(homeUrl, request.url));
    }

    // Garante que o usuário com role 'ubs' não acesse as rotas de admin
    if (sessionRole === 'ubs' && PROTECTED_ROUTES_ADMIN.includes(pathname)) {
        return NextResponse.redirect(new URL('/consulta', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // O matcher define quais rotas passarão pelo middleware
  // Evita que o middleware rode em requisições de assets (imagens, etc.)
  matcher: [
    '/',
    '/login',
    '/sao-joao',
    '/consulta',
    // Adicione outras rotas que precisam de proteção aqui
  ],
}
