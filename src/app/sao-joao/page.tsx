
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
} from 'lucide-react';
import Link from 'next/link';
import ExamTable from '@/components/dashboard/exam-table-sao-joao';
import { Button } from '@/components/ui/button';
import { signOutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function SaoJoaoPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };

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
                <SidebarMenuButton asChild tooltip="Exames de São João" isActive>
                  <Link href="/sao-joao">
                    <Map />
                    Exames de São João
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
            <h1 className="text-xl font-semibold">Exames de São João</h1>
          </div>
           <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mt-4">
            <ExamTable />
          </div>
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          2025 Todos Direitos Reservados - Grupo Belchior
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
