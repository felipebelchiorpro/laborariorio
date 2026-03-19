'use client';

import React from 'react';
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
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  FlaskConical,
  Map,
  Search,
  LogOut,
  ClipboardList,
  RefreshCw,
  LayoutDashboard,
  ShieldCheck,
  Microscope,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOutUser } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/login');
  };

  const menuItems = [
    {
      title: 'São Lucas',
      href: '/',
      icon: FlaskConical,
      color: 'text-cyan-500',
      activeColor: 'bg-cyan-500/10 text-cyan-500',
      tooltip: 'Exames do São Lucas',
    },
    {
      title: 'São João',
      href: '/sao-joao',
      icon: Microscope,
      color: 'text-indigo-500',
      activeColor: 'bg-indigo-500/10 text-indigo-500',
      tooltip: 'Exames de São João',
    },
    {
        title: 'Fichário',
        href: '/fichario',
        icon: FileText,
        color: 'text-purple-500',
        activeColor: 'bg-purple-500/10 text-purple-500',
        tooltip: 'Gestão de Fichário',
    },
    {
      title: 'Recoleta',
      href: '/recoleta',
      icon: RefreshCw,
      color: 'text-emerald-500',
      activeColor: 'bg-emerald-500/10 text-emerald-500',
      tooltip: 'Gestão de Recoleta',
    },
    {
      title: 'Relatórios',
      href: '/relatorios',
      icon: ClipboardList,
      color: 'text-amber-500',
      activeColor: 'bg-amber-500/10 text-amber-500',
      tooltip: 'Geração de Relatórios',
    },
    {
      title: 'Consulta Pública',
      href: '/consulta',
      icon: Search,
      color: 'text-slate-400',
      activeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
      tooltip: 'Consultar Resultados',
    },
  ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0 bg-sidebar/50 backdrop-blur-xl">
        <SidebarHeader className="flex h-16 items-center justify-center border-b px-4 transition-all group-data-[collapsible=icon]:px-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
              <FlaskConical className="h-5 w-5" />
            </div>
            <span className="font-poppins text-lg font-bold tracking-tight whitespace-nowrap group-data-[collapsible=icon]:hidden translate-x-0 opacity-100 transition-all">
              Laboratório <span className="text-primary">Caconde</span>
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarGroup>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.tooltip}
                      isActive={isActive}
                      className={cn(
                        "transition-all duration-200 hover:bg-muted/50",
                        isActive ? item.activeColor : "hover:text-foreground/80"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? item.color : "text-muted-foreground/60")} />
                        <span className={cn("font-medium", isActive ? "font-semibold" : "")}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-2">
           <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleSignOut}
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                  tooltip="Sair do Sistema"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-muted/30">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/60 px-4 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-[1px] bg-border md:hidden" />
            <h1 className="text-lg font-semibold tracking-tight text-foreground/90">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end text-[10px] text-muted-foreground">
                <span className="font-medium">Logado como Admin</span>
                <span>Caconde, SP</span>
             </div>
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="h-9 w-9 text-muted-foreground hover:text-red-500 transition-colors"
                title="Sair"
             >
                <LogOut className="h-5 w-5" />
             </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
           <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
             {children}
           </div>
        </main>
        <footer className="border-t bg-background/50 px-6 py-4 text-center backdrop-blur-sm">
           <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
             © 2025 Laboratório Caconde • <span className="text-primary/70">Grupo Belchior</span>
           </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
