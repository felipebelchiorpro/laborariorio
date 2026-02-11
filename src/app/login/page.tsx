
import { LoginForm } from '@/components/auth/login-form';
import { FlaskConical } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-primary p-4 text-primary-foreground">
            <FlaskConical className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold font-poppins">Laboratório Caconde</h1>
          <p className="mt-2 text-center text-muted-foreground">
            Use seu email e senha para acessar o painel.
          </p>
        </div>
        <LoginForm />
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          2025 Todos Direitos Reservados - Grupo Belchior
        </footer>
      </div>
    </div>
  );
}
