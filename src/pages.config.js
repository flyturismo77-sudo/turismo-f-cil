/**
 * pages.config.js - Page routing configuration
 */
import Assentos from './pages/Assentos';
import Clientes from './pages/Clientes';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import DespesasEmpresa from './pages/DespesasEmpresa';
import DespesasPessoal from './pages/DespesasPessoal';
import DetalhesViagem from './pages/DetalhesViagem';
import Equipe from './pages/Equipe';
import GerenciamentoArquivos from './pages/GerenciamentoArquivos';
import MapaQuartos from './pages/MapaQuartos';
import MigracaoDD from './pages/MigracaoDD';
import Recebimentos from './pages/Recebimentos';
import Usuarios from './pages/Usuarios';
import Viagens from './pages/Viagens';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assentos": Assentos,
    "Clientes": Clientes,
    "Configuracoes": Configuracoes,
    "Dashboard": Dashboard,
    "DespesasEmpresa": DespesasEmpresa,
    "DespesasPessoal": DespesasPessoal,
    "DetalhesViagem": DetalhesViagem,
    "Equipe": Equipe,
    "GerenciamentoArquivos": GerenciamentoArquivos,
    "MapaQuartos": MapaQuartos,
    "MigracaoDD": MigracaoDD,
    "Recebimentos": Recebimentos,
    "Usuarios": Usuarios,
    "Viagens": Viagens,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
