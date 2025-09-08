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
  FileVideo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import ExamTable from '@/components/dashboard/exam-table-demonstracao';

export default function DemonstracaoPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold">Laboratório Caconde</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="São Lucas">
                  <Link href="/">
                    <LayoutDashboard />
                    São Lucas
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Caconde">
                  <Link href="/caconde">
                    <MapPin />
                    Caconde
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Demonstração" isActive>
                  <Link href="/demonstracao">
                    <FileVideo />
                    Demonstração
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
            <h1 className="text-xl font-semibold">Demonstração</h1>
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
