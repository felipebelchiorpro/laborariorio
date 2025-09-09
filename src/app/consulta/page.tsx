import {
  FlaskConical,
  Map,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReadOnlyExamTable from '@/components/dashboard/read-only-exam-table';

const SAO_LUCAS_SHEET_ID = process.env.NEXT_PUBLIC_SAO_LUCAS_SHEET_ID!;
const SAO_JOAO_SHEET_ID = process.env.NEXT_PUBLIC_SAO_JOAO_SHEET_ID!;

export default function ConsultaPage() {
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
                <SidebarMenuButton asChild tooltip="Consulta Pública" isActive>
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
            <h1 className="text-xl font-semibold">Consulta Pública de Exames</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Tabs defaultValue="sao-lucas" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sao-lucas">Exames São Lucas</TabsTrigger>
                <TabsTrigger value="sao-joao">Exames São João</TabsTrigger>
              </TabsList>
              <TabsContent value="sao-lucas">
                <div className="mt-4">
                   <ReadOnlyExamTable sheetId={SAO_LUCAS_SHEET_ID} />
                </div>
              </TabsContent>
              <TabsContent value="sao-joao">
                 <div className="mt-4">
                   <ReadOnlyExamTable sheetId={SAO_JOAO_SHEET_ID} />
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
