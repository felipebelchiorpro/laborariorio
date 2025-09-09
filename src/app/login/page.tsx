
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/auth/logo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4">
            <Logo className="h-24 w-24 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-poppins">Laboratório Caconde</h1>
          <p className="mt-2 text-center text-muted-foreground">
            Acesso restrito ao painel administrativo.
          </p>
        </div>
        <LoginForm />
      </div>
       <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
          2025 Todos Direitos Reservados - Grupo Belchior
        </footer>
    </div>
  );
}
