
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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOutUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/auth/with-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportGenerator from '@/components/dashboard/report-generator';


const SAO_LUCAS_SHEET_ID = process.env.NEXT_PUBLIC_SAO_LUCAS_SHEET_ID;
const SAO_JOAO_SHEET_ID = process.env.NEXT_PUBLIC_SAO_JOAO_SHEET_ID;


function RelatoriosPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };
  
   if (!SAO_LUCAS_SHEET_ID || !SAO_JOAO_SHEET_ID) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p className="text-red-500">
                As variáveis de ambiente para os IDs das planilhas não foram configuradas.
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
                <SidebarMenuButton asChild tooltip="Relatórios" isActive>
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
            <h1 className="text-xl font-semibold">Geração de Relatórios</h1>
          </div>
           <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Tabs defaultValue="sao-lucas" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sao-lucas">Relatório São Lucas</TabsTrigger>
                <TabsTrigger value="sao-joao">Relatório São João</TabsTrigger>
              </TabsList>
              <TabsContent value="sao-lucas">
                <div className="mt-4">
                  <ReportGenerator sheetId={SAO_LUCAS_SHEET_ID} reportTitle="Relatório de Exames - São Lucas" />
                </div>
              </TabsContent>
              <TabsContent value="sao-joao">
                 <div className="mt-4">
                    <ReportGenerator sheetId={SAO_JOAO_SHEET_ID} reportTitle="Relatório de Exames - São João" />
                </div>
              </TabsContent>
            </Tabs>
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          2025 Todos Direitos Reservados - Grupo Belchior
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default withAuth(RelatoriosPage);
