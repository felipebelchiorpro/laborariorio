
import { LoginForm } from '@/components/auth/login-form';
import { FlaskConical } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="relative hidden flex-1 items-center justify-center bg-primary/10 lg:flex">
        <Image
          src="https://picsum.photos/1200/800"
          alt="Imagem de fundo do laboratório"
          fill
          className="object-cover"
          data-ai-hint="laboratory research"
        />
        <div className="absolute inset-0 bg-primary/40" />
        <div className="relative z-10 text-center text-white p-8">
            <h2 className="text-4xl font-bold font-poppins drop-shadow-md">
                Bem-vindo ao LabFlow
            </h2>
            <p className="mt-4 text-lg max-w-md drop-shadow-sm">
                A plataforma moderna para gestão e consulta de exames do Laboratório Caconde.
            </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 rounded-full bg-primary p-4 text-primary-foreground">
                <FlaskConical className="h-16 w-16" />
            </div>
            <h1 className="text-3xl font-bold font-poppins">LabFlow</h1>
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
    </div>
  );
}
