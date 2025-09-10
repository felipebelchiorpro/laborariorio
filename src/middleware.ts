
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este middleware garante que as rotas protegidas não sejam acessadas sem um token de autenticação.
// O token é gerenciado pelo Firebase SDK no lado do cliente.
export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseIdToken');
  const { pathname } = request.nextUrl;

  // Rotas que não exigem autenticação
  const publicPaths = ['/login', '/consulta'];

  // Permite o acesso a rotas públicas
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Se o usuário está tentando acessar uma rota protegida sem um token,
  // redirecione para a página de login.
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname); // Opcional: redirecionar de volta após o login
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário tem um token, permite o acesso
  return NextResponse.next();
}

export const config = {
  // Lista de rotas que serão interceptadas pelo middleware
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
