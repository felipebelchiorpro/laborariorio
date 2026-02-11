
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
} from '@/components/ui/sidebar';
import {
  Map,
  Search,
  FlaskConical,
  LogOut,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/auth/with-auth';
import RecoletaTable from '@/components/dashboard/recoleta-table';

function RecoletaPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };

  const RECOLETA_SHEET_ID = process.env.NEXT_PUBLIC_RECOLETA_SHEET_ID;

  if (!RECOLETA_SHEET_ID) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 bg-background p-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive">
          <RefreshCw className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold">Configuração Incompleta</h1>
        <p className="max-w-md text-muted-foreground">
          A variável de ambiente{' '}
          <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
            NEXT_PUBLIC_RECOLETA_SHEET_ID
          </code>{' '}
          não foi definida. Por favor, adicione esta variável no seu ambiente de
          hospedagem (Coolify) com o ID da planilha do Google Sheets para as
          recoletas.
        </p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="flex-row items-center gap-2 p-4">
            <span className="font-poppins text-lg font-semibold">Laboratório Caconde</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Exames do São Lucas">
                  <Link href="/">
                    <FlaskConical />
                    Exames do São Lucas
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Exames de São João">
                  <Link href="/sao-joao">
                    <Map />
                    Exames de São João
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Recoleta" isActive>
                  <Link href="/recoleta">
                    <RefreshCw />
                    Recoleta
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Relatórios">
                  <Link href="/relatorios">
                    <ClipboardList />
                    Relatórios
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Consulta Pública">
                  <Link href="/consulta">
                    <Search />
                    Consulta Pública
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 w-full items-center justify-between border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl font-semibold">Controle de Recoletas</h1>
          </div>
           <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mt-4">
            <RecoletaTable sheetId={RECOLETA_SHEET_ID} />
          </div>
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          2025 Todos Direitos Reservados - Grupo Belchior
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default withAuth(RecoletaPage);
