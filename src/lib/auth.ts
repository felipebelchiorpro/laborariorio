
"use client";

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  type AuthError
} from "firebase/auth";
import { app } from "./firebase";

type SignInResult = {
    success: boolean;
    error?: string;
}

const auth = getAuth(app);

// Mapeia códigos de erro do Firebase para mensagens amigáveis
const getFriendlyErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'O formato do email fornecido não é válido.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Email ou senha incorretos. Por favor, verifique suas credenciais.';
        case 'auth/too-many-requests':
            return 'Acesso bloqueado temporariamente devido a muitas tentativas de login. Tente novamente mais tarde.';
        default:
            return 'Ocorreu um erro inesperado durante o login.';
    }
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
    } catch (error) {
        const authError = error as AuthError;
        console.error("Firebase Auth Error:", authError.code, authError.message);
        const friendlyMessage = getFriendlyErrorMessage(authError.code);
        return { success: false, error: friendlyMessage };
    }
}

export async function signOutUser(): Promise<void> {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
}
