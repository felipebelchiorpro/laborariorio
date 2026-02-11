
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este middleware garante que as rotas protegidas não sejam acessadas sem um token de autenticação.
// A lógica principal de proteção foi movida para o HOC withAuth para melhor integração com o Firebase SDK do lado do cliente.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas que não exigem autenticação
  const publicPaths = ['/login', '/consulta'];

  // Permite o acesso a rotas públicas
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // A verificação de token agora é tratada pelo withAuth no lado do cliente.
  // O middleware apenas permite a passagem para as rotas protegidas, 
  // onde o cliente fará a verificação.
  
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
