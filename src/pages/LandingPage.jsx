import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import logoAgencia from '@/assets/logo-agencia-sistema.png';
import mockupSistema from '@/assets/mockup-sistema.jpg';
import testimonialBg from '@/assets/testimonial-bg.jpg';
import {
  Plane, Users, CreditCard, Bus, Calendar, FileText, BarChart3,
  MapPin, Shield, Clock, CheckCircle2, ArrowRight, Star,
  MessageSquare, Settings, Bell, Download, Globe, Smartphone,
  ChevronDown, ChevronUp, Menu, X, Zap, Target, Award, HeadphonesIcon,
  ClipboardList, Hotel, Receipt, TrendingUp, Lock, Eye, Play,
  Sparkles, BadgeCheck, Timer, Gift, CircleDollarSign, Rocket,
  ThumbsUp, Quote, Monitor, TabletSmartphone, Wifi, Database,
  RefreshCw, LayoutDashboard, PieChart, FileCheck, UserCheck
} from 'lucide-react';

const BRAND = 'Agência Sistema';

const features = [
  {
    icon: Users,
    title: 'Gestão de Clientes Completa',
    desc: 'Cadastro com CPF, endereço, grupos familiares, crianças de colo, histórico de viagens e importação em massa. Nunca perca um dado.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Plane,
    title: 'Controle Total de Viagens',
    desc: 'Crie e gerencie viagens com destinos, datas, 3 faixas de valores, vagas, múltiplas imagens e status em tempo real.',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: Bus,
    title: 'Mapa de Assentos Interativo',
    desc: '5 layouts de ônibus diferentes (Double Deck, JG Turismo, Deca Turismo e mais). Seleção visual de poltronas por andar.',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: CreditCard,
    title: 'Financeiro Inteligente',
    desc: 'Parcelas automáticas, recebimentos, despesas pessoais e empresariais. Alertas de vencimento, comprovantes e relatórios.',
    color: 'from-violet-500 to-purple-500'
  },
  {
    icon: FileText,
    title: 'Contratos Digitais com Assinatura',
    desc: 'Geração automática de contratos PDF com assinatura digital validada por CPF e IP. Link compartilhável para o cliente assinar.',
    color: 'from-rose-500 to-pink-500'
  },
  {
    icon: Hotel,
    title: 'Mapa de Quartos e Hospedagem',
    desc: 'Distribua hóspedes por quartos com controle de capacidade, tipos de cama (solteiro, casal, beliche) e ocupação visual.',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    icon: Calendar,
    title: 'Calendário Visual de Viagens',
    desc: 'Todas as viagens em um calendário interativo com cores por status. Planejamento visual completo do seu mês.',
    color: 'from-indigo-500 to-violet-500'
  },
  {
    icon: BarChart3,
    title: 'Relatórios e Rentabilidade',
    desc: 'Análise detalhada de receitas x despesas por viagem, margem de lucro, gráficos comparativos e exportação de dados.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: ClipboardList,
    title: 'Check-in e Lista de Embarque',
    desc: 'Lista digital com confirmação de presença, local de embarque personalizado e status em tempo real no dia da viagem.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: Receipt,
    title: 'Recibos PDF Automáticos',
    desc: 'Gere recibos profissionais em PDF com dados do pagamento, cliente e viagem. Download instantâneo com 1 clique.',
    color: 'from-teal-500 to-emerald-500'
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Integrado',
    desc: 'Envie mensagens diretas para clientes via WhatsApp com templates prontos para cobrança, confirmação e lembretes.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Shield,
    title: 'Segurança e Controle de Acesso',
    desc: 'Roles (Admin/Funcionário), permissões granulares, logs de auditoria completos e autenticação segura com Supabase.',
    color: 'from-slate-500 to-gray-600'
  },
];

const modules = [
  { icon: LayoutDashboard, name: 'Dashboard' },
  { icon: Plane, name: 'Viagens' },
  { icon: Users, name: 'Clientes' },
  { icon: Bus, name: 'Assentos' },
  { icon: Hotel, name: 'Quartos' },
  { icon: CreditCard, name: 'Financeiro' },
  { icon: Receipt, name: 'Recebimentos' },
  { icon: FileText, name: 'Contratos' },
  { icon: Calendar, name: 'Calendário' },
  { icon: ClipboardList, name: 'Check-in' },
  { icon: TrendingUp, name: 'Rentabilidade' },
  { icon: PieChart, name: 'Relatórios' },
  { icon: Download, name: 'Exportação' },
  { icon: MessageSquare, name: 'WhatsApp' },
  { icon: Bell, name: 'Notificações' },
  { icon: Settings, name: 'Configurações' },
  { icon: Eye, name: 'Auditoria' },
  { icon: Globe, name: 'Portal Público' },
];

const faqs = [
  { q: 'O sistema funciona em celular e tablet?', a: 'Sim! O sistema é 100% responsivo e foi testado em smartphones, tablets e desktops de todos os tamanhos. Acesse de qualquer lugar.' },
  { q: 'Preciso instalar algo no computador?', a: 'Não! Roda 100% na nuvem, basta abrir o navegador. Sem instalações, sem atualizações manuais, sem dor de cabeça.' },
  { q: 'Quantos usuários podem acessar simultaneamente?', a: 'Ilimitados! O sistema suporta múltiplos usuários com diferentes níveis de acesso (Administrador e Funcionário) ao mesmo tempo.' },
  { q: 'Meus dados ficam seguros?', a: 'Absoluto! Utilizamos Supabase (infraestrutura da AWS) com criptografia, autenticação segura, controle de acesso por roles e logs de auditoria de todas as ações.' },
  { q: 'Posso personalizar com a minha marca?', a: 'Sim! Configure nome da empresa, logo, cores, slogan, informações de contato, redes sociais e tudo mais. O sistema fica com a cara da SUA agência.' },
  { q: 'Como funciona o contrato digital?', a: 'O sistema gera contratos em PDF automaticamente com dados do cliente e viagem, incluindo assinatura digital com validação por CPF e IP. Você envia um link e o cliente assina online.' },
  { q: 'Posso importar meus clientes atuais?', a: 'Sim! O sistema permite importação em massa de clientes via JSON. Traga toda sua base sem precisar cadastrar um por um.' },
  { q: 'Tem período de teste gratuito?', a: 'Sim! Oferecemos uma demonstração completa e gratuita para você conhecer todas as funcionalidades antes de decidir.' },
];

const testimonials = [
  { name: 'Carlos M.', role: 'Dono de Agência - SP', text: 'O sistema transformou minha agência. Antes eu fazia tudo em planilhas, agora tenho controle total em um só lugar. Recomendo demais!', stars: 5 },
  { name: 'Ana Paula S.', role: 'Gestora de Turismo - MG', text: 'O mapa de assentos e o controle financeiro são incríveis. Economizo horas por semana com a automação dos contratos.', stars: 5 },
  { name: 'Roberto L.', role: 'Agência de Excursões - PE', text: 'Melhor investimento que fiz! O sistema é intuitivo, bonito e resolve TODOS os problemas que eu tinha. Suporte excelente.', stars: 5 },
];

const comparisonItems = [
  { feature: 'Gestão de Viagens', us: true, others: true },
  { feature: 'Mapa de Assentos Interativo', us: true, others: false },
  { feature: 'Mapa de Quartos', us: true, others: false },
  { feature: 'Contratos com Assinatura Digital', us: true, others: false },
  { feature: 'Parcelas e Financeiro Completo', us: true, others: 'Parcial' },
  { feature: 'WhatsApp Integrado', us: true, others: false },
  { feature: 'Check-in de Embarque', us: true, others: false },
  { feature: 'Recibos PDF Automáticos', us: true, others: false },
  { feature: 'Portal Público para Inscrições', us: true, others: false },
  { feature: 'Personalização com Sua Marca', us: true, others: 'Parcial' },
  { feature: 'Multi-usuários com Roles', us: true, others: true },
  { feature: 'Logs de Auditoria', us: true, others: false },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-foreground pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 text-muted-foreground leading-relaxed">{a}</div>}
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={logoAgencia} alt={BRAND} className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {BRAND}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {['Funcionalidades', 'Módulos', 'Preços', 'Depoimentos', 'FAQ'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                  {item}
                </a>
              ))}
              <a href="#contato">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg">
                  Quero Meu Sistema
                </Button>
              </a>
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-background border-t border-border px-4 py-4 space-y-3">
            {['Funcionalidades', 'Módulos', 'Preços', 'Depoimentos', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="block py-2 text-muted-foreground hover:text-foreground font-medium">
                {item}
              </a>
            ))}
            <a href="#contato" onClick={() => setMobileMenu(false)}>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Quero Meu Sistema</Button>
            </a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, hsl(200 80% 60%) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(180 80% 50%) 0%, transparent 50%)' }} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">O sistema #1 para agências de turismo</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-white">
                Sua agência no{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  piloto automático
                </span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100/80 mb-8 leading-relaxed">
                Viagens, clientes, assentos, quartos, financeiro, contratos, WhatsApp e muito mais — 
                <strong className="text-white"> tudo em um só lugar</strong>. 
                Pare de usar planilhas e comece a crescer.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#contato">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-xl shadow-cyan-500/25 text-lg px-8 h-14 w-full sm:w-auto">
                    <Rocket className="w-5 h-5 mr-2" /> Começar Agora — É Grátis
                  </Button>
                </a>
                <a href="#funcionalidades">
                  <Button size="lg" variant="outline" className="h-14 text-lg px-8 border-blue-400/30 text-blue-200 hover:bg-blue-500/10 w-full sm:w-auto">
                    <Play className="w-5 h-5 mr-2" /> Ver Como Funciona
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-10">
                {[
                  { icon: CheckCircle2, text: '100% na nuvem' },
                  { icon: CheckCircle2, text: 'Sem instalação' },
                  { icon: CheckCircle2, text: 'Suporte dedicado' },
                  { icon: CheckCircle2, text: 'Teste grátis' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm text-blue-200/80">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-3xl" />
                <img src={mockupSistema} alt={`Dashboard ${BRAND}`} className="relative rounded-2xl shadow-2xl border border-white/10" />
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-xl shadow-xl text-sm font-bold flex items-center gap-2">
                  <Wifi className="w-4 h-4" /> Online 24/7
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating badges */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-blue-300/60 text-xs animate-bounce">
          <ChevronDown className="w-4 h-4" /> Role para descobrir mais
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-6 bg-gradient-to-r from-blue-500 to-cyan-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-white">
            {[
              { value: '18+', label: 'Módulos' },
              { value: '500+', label: 'Viagens Gerenciadas' },
              { value: '99.9%', label: 'Uptime' },
              { value: '5★', label: 'Avaliação' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold">{stat.value}</div>
                <div className="text-white/80 text-xs font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points → Solution */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Você ainda gerencia sua agência assim?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Se você se identificou com algum desses problemas, o {BRAND} é para você.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: '📋', pain: 'Planilhas infinitas do Excel', solution: 'Dashboard inteligente com tudo centralizado' },
              { emoji: '😰', pain: 'Medo de perder dados de clientes', solution: 'Banco de dados seguro na nuvem com backup' },
              { emoji: '📱', pain: 'WhatsApp desorganizado para cobranças', solution: 'Templates prontos com envio direto integrado' },
              { emoji: '📝', pain: 'Contratos feitos à mão ou no Word', solution: 'Contratos PDF automáticos com assinatura digital' },
              { emoji: '🪑', pain: 'Mapa de assentos no papel', solution: 'Seleção visual interativa de poltronas por andar' },
              { emoji: '💸', pain: 'Não sabe se a viagem deu lucro', solution: 'Relatório de rentabilidade automático por viagem' },
            ].map((item, i) => (
              <Card key={i} className="border-border overflow-hidden group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="p-5 bg-destructive/5 border-b border-border">
                    <div className="text-2xl mb-2">{item.emoji}</div>
                    <p className="font-semibold text-destructive/80 line-through decoration-2">{item.pain}</p>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="font-medium text-foreground">{item.solution}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">12 Funcionalidades Poderosas</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Tudo que sua agência precisa — e mais
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cada funcionalidade foi construída ouvindo agências de turismo reais. Nada genérico.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="group border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="módulos" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Ecossistema Completo</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              +18 módulos 100% integrados entre si
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Todos os módulos conversam entre si. Cadastre uma viagem e os assentos, quartos, financeiro e contratos já ficam conectados.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-4">
            {modules.map((m, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group cursor-default">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center group-hover:from-blue-500 group-hover:to-cyan-500 transition-all">
                  <m.icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Comparativo</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Por que escolher o {BRAND}?
            </h2>
            <p className="text-lg text-muted-foreground">Veja o que nos diferencia dos concorrentes</p>
          </div>
          <Card className="overflow-hidden border-border shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 font-semibold text-foreground">Funcionalidade</th>
                    <th className="text-center p-4 font-semibold">
                      <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{BRAND}</span>
                    </th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Outros Sistemas</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonItems.map((item, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-4 text-sm text-foreground">{item.feature}</td>
                      <td className="p-4 text-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                      </td>
                      <td className="p-4 text-center">
                        {item.others === true ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : item.others === 'Parcial' ? (
                          <span className="text-xs text-amber-500 font-medium">Parcial</span>
                        ) : (
                          <X className="w-5 h-5 text-destructive/50 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Super Simples</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Comece a usar em 4 passos
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: Settings, title: 'Configure', desc: 'Personalize com sua marca, logo, cores e dados da empresa. Leva 5 minutos.', color: 'from-blue-500 to-cyan-500' },
              { step: '02', icon: Plane, title: 'Crie Viagens', desc: 'Cadastre destinos, datas, valores e monte o mapa de assentos do ônibus.', color: 'from-amber-500 to-orange-500' },
              { step: '03', icon: Users, title: 'Cadastre Clientes', desc: 'Adicione passageiros, gere contratos automáticos e registre pagamentos.', color: 'from-emerald-500 to-green-500' },
              { step: '04', icon: TrendingUp, title: 'Lucre Mais', desc: 'Dashboard em tempo real com relatórios, financeiro e indicadores de lucro.', color: 'from-violet-500 to-purple-500' },
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="text-7xl font-extrabold text-muted/30 mb-4 group-hover:text-primary/20 transition-colors">{item.step}</div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights / Built for */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <BadgeCheck className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Feito para Turismo Rodoviário</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
                Construído para o{' '}
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  turismo rodoviário brasileiro
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Diferente de sistemas genéricos, o {BRAND} foi desenvolvido do zero pensando nas necessidades reais de quem vive de excursões e viagens de ônibus.
              </p>
              <div className="space-y-3">
                {[
                  'Mapa de assentos para 5 modelos de ônibus DD',
                  'Contratos com assinatura digital e validação por CPF',
                  'Controle de parcelas com alertas automáticos',
                  'Portal público para clientes se inscreverem online',
                  'Geração automática de recibos em PDF profissional',
                  'Integração direta com WhatsApp para cobrança',
                  'Distribuição inteligente de quartos por cama',
                  'Dashboard com métricas de rentabilidade por viagem',
                  'Check-in digital no dia do embarque',
                  'Facebook Ads integrado para análise de campanhas',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-2xl" />
              <img src={mockupSistema} alt="Sistema de gestão" className="relative rounded-2xl shadow-2xl border border-border" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preços" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <CircleDollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Investimento</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho da sua operação
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '197',
                desc: 'Ideal para quem está começando',
                features: ['Até 5 viagens/mês', '1 usuário admin', 'Gestão de clientes', 'Mapa de assentos', 'Contratos digitais', 'Suporte por e-mail'],
                cta: 'Começar com Starter',
                popular: false
              },
              {
                name: 'Profissional',
                price: '397',
                desc: 'Para agências em crescimento',
                features: ['Viagens ilimitadas', 'Até 5 usuários', 'Todos os módulos', 'WhatsApp integrado', 'Relatórios avançados', 'Portal público', 'Suporte prioritário'],
                cta: 'Escolher Profissional',
                popular: true
              },
              {
                name: 'Enterprise',
                price: '697',
                desc: 'Operação de grande porte',
                features: ['Tudo do Profissional', 'Usuários ilimitados', 'Multi-empresas', 'Facebook Ads', 'API customizada', 'Onboarding dedicado', 'Suporte 24/7'],
                cta: 'Falar com Vendas',
                popular: false
              },
            ].map((plan, i) => (
              <Card key={i} className={`relative overflow-hidden border-border ${plan.popular ? 'border-2 border-cyan-500 shadow-2xl shadow-cyan-500/10 scale-105' : 'hover:shadow-xl'} transition-all`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                    MAIS POPULAR
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">R${plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="#contato">
                    <Button className={`w-full h-12 font-semibold ${plan.popular ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                      {plan.cta}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            <Gift className="w-4 h-4 inline mr-1 text-amber-500" />
            Todos os planos incluem <strong>7 dias grátis</strong> para testar sem compromisso
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={testimonialBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/90" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <ThumbsUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Depoimentos</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Quem usa, aprova
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <Quote className="w-8 h-8 text-cyan-500/30 mb-4" />
                  <p className="text-foreground mb-6 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-1 mb-3">
                    {Array(t.stars).fill(0).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: 'Dados Seguros', desc: 'Criptografia e backup automático na nuvem AWS' },
              { icon: TabletSmartphone, title: '100% Responsivo', desc: 'Funciona em celular, tablet e desktop' },
              { icon: RefreshCw, title: 'Atualizações Grátis', desc: 'Novas funcionalidades sem custo adicional' },
              { icon: HeadphonesIcon, title: 'Suporte Humano', desc: 'Atendimento real por WhatsApp e e-mail' },
            ].map((item, i) => (
              <Card key={i} className="border-border text-center hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Tire Suas Dúvidas</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Perguntas Frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* Urgency CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <Timer className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Oferta por tempo limitado
          </h2>
          <p className="text-xl text-white/90 mb-6">
            Ganhe <strong>30 dias grátis + configuração inicial inclusa</strong> ao assinar agora
          </p>
          <a href="#contato">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 shadow-xl text-lg px-10 h-14 font-bold">
              <Rocket className="w-5 h-5 mr-2" /> Garantir Minha Vaga
            </Button>
          </a>
          <p className="text-sm text-white/60 mt-4">Vagas limitadas para onboarding personalizado</p>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contato" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-3xl" />
            <div className="relative bg-card border border-border rounded-3xl p-12 md:p-16 shadow-2xl">
              <img src={logoAgencia} alt={BRAND} className="w-20 h-20 mx-auto mb-6 object-contain" />
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Pronto para transformar sua agência?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Junte-se a centenas de agências que já automatizaram sua operação. 
                Agende uma demonstração gratuita agora mesmo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/5581999999999?text=Olá! Gostaria de conhecer o Agência Sistema para minha agência de turismo."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl text-lg px-8 h-14 w-full sm:w-auto">
                    <MessageSquare className="w-5 h-5 mr-2" /> Falar no WhatsApp
                  </Button>
                </a>
                <a href="mailto:contato@agenciasistema.com.br">
                  <Button size="lg" variant="outline" className="h-14 text-lg px-8 w-full sm:w-auto">
                    Enviar E-mail
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Demonstração gratuita</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sem compromisso</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Setup incluso</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoAgencia} alt={BRAND} className="w-10 h-10 object-contain" />
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{BRAND}</span>
                  <p className="text-xs text-muted-foreground">Sistema de Gestão para Agências de Turismo</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                A plataforma mais completa do Brasil para gestão de agências de turismo rodoviário. Automatize, organize e lucre mais.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Navegação</h4>
              <ul className="space-y-2 text-sm">
                {['Funcionalidades', 'Módulos', 'Preços', 'Depoimentos', 'FAQ'].map(item => (
                  <li key={item}><a href={`#${item.toLowerCase()}`} className="text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>contato@agenciasistema.com.br</li>
                <li>(81) 99999-9999</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {BRAND}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
