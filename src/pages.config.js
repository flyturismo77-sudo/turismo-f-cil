/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Assentos from './pages/Assentos';
import Clientes from './pages/Clientes';
import Configuracoes from './pages/Configuracoes';
import Contato from './pages/Contato';
import Dashboard from './pages/Dashboard';
import DetalhesViagem from './pages/DetalhesViagem';
import Equipe from './pages/Equipe';
import Financeiro from './pages/Financeiro';
import FormularioContrato from './pages/FormularioContrato';
import Formularios from './pages/Formularios';
import Fornecedores from './pages/Fornecedores';
import GerenciamentoArquivos from './pages/GerenciamentoArquivos';
import Home from './pages/Home';
import LogsAuditoria from './pages/LogsAuditoria';
import MapaQuartos from './pages/MapaQuartos';
import Mensagens from './pages/Mensagens';
import MigracaoDD from './pages/MigracaoDD';
import PagamentosEmpresa from './pages/PagamentosEmpresa';
import Relatorios from './pages/Relatorios';
import Sobre from './pages/Sobre';
import Usuarios from './pages/Usuarios';
import Viagens from './pages/Viagens';
import ViagensPublico from './pages/ViagensPublico';
import WhatsApp from './pages/WhatsApp';
import Exportacao from './pages/Exportacao';
import Documentacao from './pages/Documentacao';
import Login from './pages/Login';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assentos": Assentos,
    "Clientes": Clientes,
    "Configuracoes": Configuracoes,
    "Contato": Contato,
    "Dashboard": Dashboard,
    "DetalhesViagem": DetalhesViagem,
    "Equipe": Equipe,
    "Financeiro": Financeiro,
    "FormularioContrato": FormularioContrato,
    "Formularios": Formularios,
    "Fornecedores": Fornecedores,
    "GerenciamentoArquivos": GerenciamentoArquivos,
    "Home": Home,
    "LogsAuditoria": LogsAuditoria,
    "MapaQuartos": MapaQuartos,
    "Mensagens": Mensagens,
    "MigracaoDD": MigracaoDD,
    "PagamentosEmpresa": PagamentosEmpresa,
    "Relatorios": Relatorios,
    "Sobre": Sobre,
    "Usuarios": Usuarios,
    "Viagens": Viagens,
    "ViagensPublico": ViagensPublico,
    "WhatsApp": WhatsApp,
    "Exportacao": Exportacao,
    "Documentacao": Documentacao,
    "Login": Login,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};