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

  const navigationItems = [
    { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
    { title: "Viagens", url: createPageUrl("Viagens"), icon: Plane },
    { title: "Clientes", url: createPageUrl("Clientes"), icon: Users },
    { title: "Assentos", url: createPageUrl("Assentos"), icon: Armchair },
    { title: "Quartos", url: createPageUrl("MapaQuartos"), icon: Hotel },
    { title: "Recebimentos", url: createPageUrl("Recebimentos"), icon: Receipt },
    { title: "Desp. Pessoal", url: createPageUrl("DespesasPessoal"), icon: UserCheck },
    { title: "Desp. Empresa", url: createPageUrl("DespesasEmpresa"), icon: Building2 },
    { title: "Equipe", url: createPageUrl("Equipe"), icon: UsersRound },
    { title: "Usuários", url: createPageUrl("Usuarios"), icon: UserCog },
    { title: "Backup", url: createPageUrl("GerenciamentoArquivos"), icon: HardDrive },
    { title: "Migração DD", url: createPageUrl("MigracaoDD"), icon: RefreshCw },
    { title: "Configurações", url: createPageUrl("Configuracoes"), icon: Settings },
  ];

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-blue-50">
          <Sidebar className="border-r border-gray-200 bg-white">
            <SidebarHeader className="border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                {config?.logo_url ? (
                  <img src={config.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-400 via-blue-600 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Plane className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-lg text-gray-900">
                    {config?.nome_empresa || "Fly Turismo"}
                  </h2>
                  <p className="text-xs text-gray-500">Sistema de Gestão</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  Menu Principal
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-sky-50 hover:text-sky-700 transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === item.url ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg' : ''
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>



            </SidebarContent>

            <SidebarFooter className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">A</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">Administrador</p>
                  <p className="text-xs text-green-600 font-medium">Admin</p>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <h1 className="text-xl font-semibold text-gray-900">
                  {config?.nome_empresa || "Fly Turismo"}
                </h1>
              </div>
            </header>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
