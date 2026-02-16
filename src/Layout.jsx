import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, 
  Plane, 
  Users, 
  Armchair, 
  Menu,
  Settings,
  Hotel,
  UserCog,
  HardDrive,
  RefreshCw,
  Receipt,
  UserCheck,
  Building2,
  UsersRound,
  ChevronRight,
  Wallet,
  LogOut,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Separator } from "@/components/ui/separator";

const navSections = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { title: "Viagens", url: createPageUrl("Viagens"), icon: Plane },
      { title: "Clientes", url: createPageUrl("Clientes"), icon: Users },
    ]
  },
  {
    label: "Operacional",
    items: [
      { title: "Assentos", url: createPageUrl("Assentos"), icon: Armchair },
      { title: "Quartos", url: createPageUrl("MapaQuartos"), icon: Hotel },
      { title: "Equipe", url: createPageUrl("Equipe"), icon: UsersRound },
    ]
  },
  {
    label: "Financeiro",
    items: [
      { title: "Recebimentos", url: createPageUrl("Recebimentos"), icon: Receipt },
      { title: "Contratos", url: createPageUrl("Contratos"), icon: FileText },
      { title: "Desp. Pessoal", url: createPageUrl("DespesasPessoal"), icon: UserCheck },
      { title: "Desp. Empresa", url: createPageUrl("DespesasEmpresa"), icon: Building2 },
    ]
  },
  {
    label: "Sistema",
    items: [
      { title: "Usuários", url: createPageUrl("Usuarios"), icon: UserCog },
      { title: "Backup", url: createPageUrl("GerenciamentoArquivos"), icon: HardDrive },
      { title: "Migração DD", url: createPageUrl("MigracaoDD"), icon: RefreshCw },
      { title: "Configurações", url: createPageUrl("Configuracoes"), icon: Settings },
    ]
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracao_empresa')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const currentTitle = navSections
    .flatMap(s => s.items)
    .find(i => location.pathname === i.url)?.title || currentPageName || "Dashboard";

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <Sidebar className="gradient-sidebar border-r-0">
            {/* Logo */}
            <SidebarHeader className="px-5 py-6">
              <div className="flex items-center gap-3">
                {config?.logo_url ? (
                  <img src={config.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
                ) : (
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow-primary">
                    <Plane className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                <div>
                  <h2 className="font-display font-bold text-base text-sidebar-primary-foreground tracking-tight">
                    {config?.nome_empresa || "Fly Turismo"}
                  </h2>
                  <p className="text-[11px] text-sidebar-foreground/50 font-medium">
                    Sistema de Gestão
                  </p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="px-3 py-1 overflow-y-auto">
              {navSections.map((section, idx) => (
                <SidebarGroup key={section.label}>
                  <SidebarGroupLabel className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.12em] px-3 mb-1">
                    {section.label}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                              asChild 
                              className={`group transition-all duration-200 rounded-lg mb-0.5 ${
                                isActive 
                                  ? 'gradient-primary text-primary-foreground shadow-glow-primary' 
                                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                              }`}
                            >
                              <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                                <item.icon className={`w-[18px] h-[18px] ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}`} />
                                <span className="text-sm font-medium">{item.title}</span>
                                {isActive && (
                                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                  {idx < navSections.length - 1 && (
                    <Separator className="my-2 bg-sidebar-border/50" />
                  )}
                </SidebarGroup>
              ))}
            </SidebarContent>

            <SidebarFooter className="px-4 py-4 border-t border-sidebar-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shadow-glow-primary">
                  <span className="text-primary-foreground font-semibold text-sm">A</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sidebar-foreground text-sm truncate">Admin</p>
                  <p className="text-[11px] text-sidebar-foreground/50">Administrador</p>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header Bar */}
            <header className="bg-card border-b border-border px-6 py-3 flex items-center gap-4 shadow-soft">
              <SidebarTrigger className="hover:bg-secondary p-2 rounded-lg transition-colors duration-200 md:hidden">
                <Menu className="w-5 h-5 text-foreground" />
              </SidebarTrigger>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-display font-semibold text-foreground">
                  {currentTitle}
                </h1>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-6 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
