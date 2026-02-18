import React, { useEffect, useState } from "react";
import logoFly from "@/assets/logo-fly-turismo.jpg";
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
  LogOut,
  FileText,
  ClipboardList,
  Moon,
  Sun,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
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
import { useQuery } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

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
      { title: "Desp. Pessoal", url: createPageUrl("DespesasPessoal"), icon: UserCheck },
      { title: "Desp. Empresa", url: createPageUrl("DespesasEmpresa"), icon: Building2 },
    ]
  },
  {
    label: "Contratos",
    items: [
      { title: "Contratos", url: createPageUrl("Contratos"), icon: FileText },
      { title: "Formulários", url: createPageUrl("Formularios"), icon: ClipboardList },
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
  const { profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pendingForms, setPendingForms] = useState(0);
  const [overdueInstallments, setOverdueInstallments] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    navigate('/Login');
  };

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

  // Realtime badge for pending formularios
  useEffect(() => {
    const fetchFormCount = async () => {
      const { count } = await supabase
        .from('formularios_contrato')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pendente');
      setPendingForms(count || 0);
    };
    fetchFormCount();

    const channel = supabase
      .channel('formularios_badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'formularios_contrato' }, fetchFormCount)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Realtime badge for overdue installments
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    const fetchOverdueCount = async () => {
      const { count } = await supabase
        .from('parcelas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pendente')
        .lt('data_vencimento', today);
      setOverdueInstallments(count || 0);
    };
    fetchOverdueCount();

    const channel2 = supabase
      .channel('parcelas_badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parcelas' }, fetchOverdueCount)
      .subscribe();

    return () => supabase.removeChannel(channel2);
  }, []);

  const getBadge = (title) => {
    if (title === 'Formulários' && pendingForms > 0) {
      return (
        <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
          {pendingForms > 99 ? '99+' : pendingForms}
        </span>
      );
    }
    if (title === 'Recebimentos' && overdueInstallments > 0) {
      return (
        <span className="min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
          {overdueInstallments > 99 ? '99+' : overdueInstallments}
        </span>
      );
    }
    return null;
  };

  const currentTitle = navSections
    .flatMap(s => s.items)
    .find(i => location.pathname === i.url)?.title || currentPageName || "Dashboard";

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-900">
          <Sidebar className="border-r-0" style={{ background: 'linear-gradient(180deg, #162d4a 0%, #1e3a5f 100%)' }}>
            {/* Logo */}
            <SidebarHeader className="px-5 py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                  <img src={config?.logo_url || logoFly} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-white tracking-tight">
                    {config?.nome_empresa || "Fly Turismo"}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sistema de Gestão
                  </p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="px-3 py-1 overflow-y-auto">
              {navSections.map((section, idx) => (
                <SidebarGroup key={section.label}>
                  <SidebarGroupLabel className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.12em] px-3 mb-1">
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
                              className={`group transition-all duration-200 rounded-xl mb-0.5 ${
                                isActive 
                                  ? 'bg-gradient-to-r from-sky-400 to-sky-500 text-white shadow-lg shadow-sky-500/25' 
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-sky-300'
                              }`}
                            >
                              <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'opacity-70 group-hover:opacity-100'}`} />
                                <span className="text-sm font-medium flex-1">{item.title}</span>
                                {getBadge(item.title)}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                  {idx < navSections.length - 1 && (
                    <Separator className="my-2 bg-slate-800" />
                  )}
                </SidebarGroup>
              ))}
            </SidebarContent>

            <SidebarFooter className="px-4 py-4 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 text-sm truncate">{profile?.full_name || 'Usuário'}</p>
                  <p className="text-[11px] text-slate-500">{profile?.cargo || (isAdmin ? 'Gerente' : 'Funcionário')}</p>
                </div>
                <button
                  onClick={() => setDarkMode(d => !d)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-sky-300 transition-colors"
                  title={darkMode ? "Modo claro" : "Modo escuro"}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors" title="Sair">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header Bar */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-6 py-3.5 flex items-center gap-4 shadow-sm">
              <SidebarTrigger className="hover:bg-sky-50 dark:hover:bg-slate-700 p-2 rounded-xl transition-colors duration-200 md:hidden">
                <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </SidebarTrigger>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-display font-semibold text-slate-800 dark:text-slate-100">
                  {currentTitle}
                </h1>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50/80 dark:bg-slate-900/80 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
