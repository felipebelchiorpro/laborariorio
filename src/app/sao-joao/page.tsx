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
  LayoutDashboard,
  FlaskConical,
  Bell,
  Search,
  MapPin,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import ExamTable from '@/components/dashboard/exam-table-sao-joao';

export default function SaoJoaoPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="flex items-center gap-2 p-4">
           {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logoprefeitura.png"
              alt="Logo da Prefeitura"
              className="h-12 w-auto object-contain"
            />
            <span className="font-poppins text-lg font-semibold">Laboratório Caconde</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Exames do São Lucas">
                  <Link href="/">
                    <LayoutDashboard />
                    Exames do São Lucas
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Exames de São João" isActive>
                  <Link href="/sao-joao">
                    <MapPin />
                    Exames de São João
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Consulta Pública">
                  <Link href="/consulta">
                    <Eye />
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
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Alternar notificações</span>
            </Button>
            <div className="h-10 w-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logoprefeitura.png"
                alt="Logo da Prefeitura"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
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
