
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// O Firebase Auth agora é gerenciado no lado do cliente.
// O middleware pode ser usado para outras finalidades, mas a proteção de rotas
// baseada em cookies personalizados não é mais a abordagem principal.

// Esta é uma configuração de middleware simplificada. A lógica de redirecionamento
// se o usuário não estiver logado será tratada no lado do cliente (nos componentes de página).
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Este matcher vazio significa que o middleware não será executado em nenhuma rota por enquanto.
  // Podemos reativá-lo se precisarmos de lógica de servidor para redirecionamentos.
  matcher: [],
}
