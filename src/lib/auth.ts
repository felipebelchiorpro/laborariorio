
"use server";

import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "lab_session";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function login(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD) {
    console.error("A variável de ambiente ADMIN_PASSWORD não está definida.");
    return false;
  }

  if (password === ADMIN_PASSWORD) {
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
    });
    return true;
  }

  return false;
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value === "true";
}
