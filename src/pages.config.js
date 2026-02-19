/**
 * pages.config.js - Page routing configuration
 */
import Assentos from './pages/Assentos';
import Calendario from './pages/Calendario';
import CheckinEmbarque from './pages/CheckinEmbarque';
import Clientes from './pages/Clientes';
import Configuracoes from './pages/Configuracoes';
import Contratos from './pages/Contratos';
import Dashboard from './pages/Dashboard';
import DespesasEmpresa from './pages/DespesasEmpresa';
import DespesasPessoal from './pages/DespesasPessoal';
import DetalhesViagem from './pages/DetalhesViagem';
import Equipe from './pages/Equipe';
import Formularios from './pages/Formularios';
import GerenciamentoArquivos from './pages/GerenciamentoArquivos';
import MapaQuartos from './pages/MapaQuartos';
import MigracaoDD from './pages/MigracaoDD';
import Notificacoes from './pages/Notificacoes';
import Recebimentos from './pages/Recebimentos';
import Rentabilidade from './pages/Rentabilidade';
import Usuarios from './pages/Usuarios';
import Viagens from './pages/Viagens';
import Documentacao from './pages/Documentacao';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Assentos": Assentos,
    "Calendario": Calendario,
    "CheckinEmbarque": CheckinEmbarque,
    "Clientes": Clientes,
    "Configuracoes": Configuracoes,
    "Contratos": Contratos,
    "Dashboard": Dashboard,
    "DespesasEmpresa": DespesasEmpresa,
    "DespesasPessoal": DespesasPessoal,
    "DetalhesViagem": DetalhesViagem,
    "Equipe": Equipe,
    "Formularios": Formularios,
    "GerenciamentoArquivos": GerenciamentoArquivos,
    "MapaQuartos": MapaQuartos,
    "MigracaoDD": MigracaoDD,
    "Notificacoes": Notificacoes,
    "Recebimentos": Recebimentos,
    "Rentabilidade": Rentabilidade,
    "Usuarios": Usuarios,
    "Viagens": Viagens,
    "Documentacao": Documentacao,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
