import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login';
import InscricaoViagem from '@/pages/InscricaoViagem';
import FormularioContrato from '@/pages/FormularioContrato';
import Home from '@/pages/Home';
import ViagensPublico from '@/pages/ViagensPublico';
import Sobre from '@/pages/Sobre';
import Contato from '@/pages/Contato';
import AdminRoute from '@/components/AdminRoute';
import AssinaturaContrato from '@/pages/AssinaturaContrato';
import PortalCliente from '@/pages/PortalCliente';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }
  
  return children;
};

// Pages that require admin (Gerente) role
const ADMIN_ONLY_PAGES = new Set([
  'Rentabilidade',
  'DespesasPessoal',
  'DespesasEmpresa',
  'Usuarios',
  'GerenciamentoArquivos',
  'MigracaoDD',
  'Configuracoes',
]);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas públicas (sem autenticação) */}
      <Route path="/Login" element={<Login />} />
      <Route path="/InscricaoViagem" element={<InscricaoViagem />} />
      <Route path="/FormularioContrato" element={<FormularioContrato />} />
      <Route path="/Home" element={<Home />} />
      <Route path="/ViagensPublico" element={<ViagensPublico />} />
      <Route path="/Sobre" element={<Sobre />} />
      <Route path="/Contato" element={<Contato />} />
      <Route path="/AssinaturaContrato" element={<AssinaturaContrato />} />
      <Route path="/PortalCliente" element={<PortalCliente />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        </ProtectedRoute>
      } />
      
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <ProtectedRoute>
              <LayoutWrapper currentPageName={path}>
                {ADMIN_ONLY_PAGES.has(path) ? (
                  <AdminRoute><Page /></AdminRoute>
                ) : (
                  <Page />
                )}
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
