
"use server";

import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "lab_session";

// As variáveis de ambiente são lidas diretamente do processo
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const UBS_PASSWORD = process.env.UBS_PASSWORD;

type LoginResult = {
    success: boolean;
    role: 'admin' | 'ubs' | null;
}

export async function login(password: string): Promise<LoginResult> {
  // Verificação explícita para garantir que as senhas foram carregadas do .env
  if (!ADMIN_PASSWORD || !UBS_PASSWORD) {
    console.error("ERRO CRÍTICO: As variáveis de ambiente ADMIN_PASSWORD e/ou UBS_PASSWORD não foram carregadas. Verifique o arquivo .env na raiz do projeto.");
    // Retorna um erro genérico para o usuário por segurança
    return { success: false, role: null };
  }

  const cookieStore = cookies();
  
  // Compara a senha fornecida com as senhas carregadas do ambiente
  if (password === ADMIN_PASSWORD) {
    cookieStore.set(SESSION_COOKIE_NAME, "admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
    });
    return { success: true, role: 'admin' };
  }
  
  if (password === UBS_PASSWORD) {
    cookieStore.set(SESSION_COOKIE_NAME, "ubs", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
    });
    return { success: true, role: 'ubs' };
  }

  return { success: false, role: null };
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionRole(): Promise<'admin' | 'ubs' | null> {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (session?.value === 'admin' || session?.value === 'ubs') {
    return session.value;
  }
  return null;
}
