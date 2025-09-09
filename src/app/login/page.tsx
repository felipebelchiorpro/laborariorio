
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100"
              height="100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-24 w-24 object-contain text-muted-foreground"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Laboratório Caconde</h1>
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
