import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import logoFly from '@/assets/logo-fly-turismo.jpg';
import mockupDashboard from '@/assets/mockup-dashboard.jpg';
import heroBg from '@/assets/landing-hero-bg.jpg';
import {
  Plane, Users, CreditCard, Bus, Calendar, FileText, BarChart3, 
  MapPin, Shield, Clock, CheckCircle2, ArrowRight, Star, 
  MessageSquare, Settings, Bell, Download, Globe, Smartphone,
  ChevronDown, ChevronUp, Menu, X, Zap, Target, Award, HeadphonesIcon,
  ClipboardList, Hotel, Receipt, TrendingUp, Lock, Eye
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Gestão de Clientes',
    desc: 'Cadastro completo com CPF, endereço, grupos familiares, crianças de colo e histórico de viagens. Importação em massa via JSON.',
    color: 'from-sky-500 to-blue-600'
  },
  {
    icon: Plane,
    title: 'Controle de Viagens',
    desc: 'Crie e gerencie viagens com destinos, datas, valores diferenciados, vagas, imagens e status em tempo real.',
    color: 'from-amber-500 to-orange-600'
  },
  {
    icon: Bus,
    title: 'Mapa de Assentos',
    desc: 'Layouts interativos para múltiplos modelos de ônibus (Double Deck, JG Turismo, Deca Turismo). Seleção visual de poltronas.',
    color: 'from-emerald-500 to-green-600'
  },
  {
    icon: CreditCard,
    title: 'Financeiro Completo',
    desc: 'Controle de parcelas, recebimentos, despesas pessoais e empresariais. Alertas de vencimento e comprovantes.',
    color: 'from-violet-500 to-purple-600'
  },
  {
    icon: FileText,
    title: 'Contratos Digitais',
    desc: 'Geração automática de contratos PDF com assinatura digital, dados do cliente e cláusulas personalizáveis.',
    color: 'from-rose-500 to-red-600'
  },
  {
    icon: Hotel,
    title: 'Mapa de Quartos',
    desc: 'Distribuição de hóspedes por quartos com controle de capacidade, tipos de cama e ocupação visual.',
    color: 'from-cyan-500 to-teal-600'
  },
  {
    icon: Calendar,
    title: 'Calendário de Viagens',
    desc: 'Visualização em calendário de todas as viagens programadas com cores e filtros por status.',
    color: 'from-indigo-500 to-blue-700'
  },
  {
    icon: BarChart3,
    title: 'Relatórios e Rentabilidade',
    desc: 'Análise detalhada de receitas x despesas por viagem, margem de lucro e exportação de dados.',
    color: 'from-pink-500 to-rose-600'
  },
  {
    icon: ClipboardList,
    title: 'Check-in e Embarque',
    desc: 'Lista de embarque digital com confirmação de presença, local de embarque e status em tempo real.',
    color: 'from-orange-500 to-amber-600'
  },
  {
    icon: Receipt,
    title: 'Recibos Automáticos',
    desc: 'Geração de recibos em PDF com dados completos do pagamento, cliente e viagem. Download instantâneo.',
    color: 'from-teal-500 to-emerald-600'
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Integrado',
    desc: 'Envie mensagens diretas para clientes via WhatsApp com templates para cobrança, confirmação e lembretes.',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Shield,
    title: 'Controle de Acesso',
    desc: 'Sistema de roles (Admin/Funcionário) com permissões granulares, logs de auditoria e rotas protegidas.',
    color: 'from-slate-500 to-gray-700'
  },
];

const modules = [
  { icon: BarChart3, name: 'Dashboard' },
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
  { icon: Download, name: 'Exportação' },
  { icon: MessageSquare, name: 'WhatsApp' },
  { icon: Bell, name: 'Notificações' },
  { icon: Settings, name: 'Configurações' },
  { icon: Eye, name: 'Auditoria' },
];

const faqs = [
  {
    q: 'O sistema funciona em celular?',
    a: 'Sim! O sistema é 100% responsivo e funciona perfeitamente em smartphones, tablets e desktops.'
  },
  {
    q: 'Preciso instalar algo no computador?',
    a: 'Não! O sistema roda 100% na nuvem, basta acessar pelo navegador. Sem instalações, sem atualizações manuais.'
  },
  {
    q: 'Quantos usuários podem acessar?',
    a: 'O sistema suporta múltiplos usuários com diferentes níveis de acesso (Administrador e Funcionário).'
  },
  {
    q: 'Os dados ficam seguros?',
    a: 'Sim! Utilizamos Supabase com criptografia, autenticação segura, controle de acesso por roles e logs de auditoria completos.'
  },
  {
    q: 'Posso personalizar com minha marca?',
    a: 'Sim! O sistema permite configurar nome da empresa, logo, cores, slogan e todas as informações de contato.'
  },
  {
    q: 'Como funciona o contrato digital?',
    a: 'O sistema gera contratos em PDF automaticamente com os dados do cliente e viagem, incluindo assinatura digital com validação por CPF e IP.'
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-foreground pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
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
              <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md">
                <img src={logoFly} alt="Fly Turismo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                Fly Sistema
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#funcionalidades" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Funcionalidades</a>
              <a href="#modulos" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Módulos</a>
              <a href="#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Como Funciona</a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">FAQ</a>
              <a href="#contato">
                <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-primary-foreground shadow-lg">
                  Quero Conhecer
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
            <a href="#funcionalidades" onClick={() => setMobileMenu(false)} className="block py-2 text-muted-foreground hover:text-foreground font-medium">Funcionalidades</a>
            <a href="#modulos" onClick={() => setMobileMenu(false)} className="block py-2 text-muted-foreground hover:text-foreground font-medium">Módulos</a>
            <a href="#como-funciona" onClick={() => setMobileMenu(false)} className="block py-2 text-muted-foreground hover:text-foreground font-medium">Como Funciona</a>
            <a href="#faq" onClick={() => setMobileMenu(false)} className="block py-2 text-muted-foreground hover:text-foreground font-medium">FAQ</a>
            <a href="#contato" onClick={() => setMobileMenu(false)}>
              <Button className="w-full bg-gradient-to-r from-sky-500 to-blue-600">Quero Conhecer</Button>
            </a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Sistema completo para agências de turismo</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Gerencie sua{' '}
                <span className="bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
                  agência de turismo
                </span>{' '}
                com total controle
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Viagens, clientes, assentos, quartos, financeiro, contratos e muito mais — tudo em um só lugar. 
                O sistema mais completo para quem vive de turismo rodoviário.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#contato">
                  <Button size="lg" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-primary-foreground shadow-xl text-lg px-8 h-14">
                    Solicitar Demonstração <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a href="#funcionalidades">
                  <Button size="lg" variant="outline" className="h-14 text-lg px-8">
                    Ver Funcionalidades
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-6 mt-10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">100% na nuvem</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Suporte dedicado</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Sem instalação</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 to-blue-600/20 rounded-2xl blur-2xl" />
                <img
                  src={mockupDashboard}
                  alt="Dashboard do Sistema Fly Turismo"
                  className="relative rounded-2xl shadow-2xl border border-border"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '16+', label: 'Módulos Integrados' },
              { value: '100%', label: 'Responsivo' },
              { value: '24/7', label: 'Disponível Online' },
              { value: '∞', label: 'Viagens Ilimitadas' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Funcionalidades</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Tudo que sua agência precisa em um só sistema
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desenvolvido especificamente para agências de turismo rodoviário, cada funcionalidade foi pensada para otimizar sua operação.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="group border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6 text-primary-foreground" />
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
      <section id="modulos" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Módulos</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              +16 módulos totalmente integrados
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cada módulo se conecta aos demais, criando um ecossistema completo de gestão para sua agência.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {modules.map((m, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-600/10 flex items-center justify-center group-hover:from-sky-500 group-hover:to-blue-600 transition-all">
                  <m.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center">
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Como Funciona</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Simples de começar, poderoso de usar
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: Settings, title: 'Configuração', desc: 'Personalize com sua marca, logo, cores e informações da empresa.' },
              { step: '02', icon: Plane, title: 'Crie Viagens', desc: 'Cadastre destinos, datas, valores e configure assentos do ônibus.' },
              { step: '03', icon: Users, title: 'Adicione Clientes', desc: 'Cadastre passageiros, gere contratos e controle pagamentos.' },
              { step: '04', icon: TrendingUp, title: 'Acompanhe Tudo', desc: 'Dashboard em tempo real com relatórios, financeiro e indicadores.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="text-6xl font-extrabold text-muted/50 mb-4 group-hover:text-primary/20 transition-colors">
                  {item.step}
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <item.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
                Construído para o{' '}
                <span className="bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
                  turismo rodoviário brasileiro
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Diferente de sistemas genéricos, o Fly Sistema foi desenvolvido do zero pensando nas necessidades reais de agências de turismo rodoviário.
              </p>
              <div className="space-y-4">
                {[
                  'Mapa de assentos para ônibus Double Deck (DD)',
                  'Contratos com assinatura digital e validação por CPF',
                  'Controle de parcelas com alertas de vencimento',
                  'Portal público para clientes se inscreverem nas viagens',
                  'Geração automática de recibos em PDF',
                  'Integração direta com WhatsApp para cobrança',
                  'Distribuição de quartos com controle de camas',
                  'Dashboard com métricas de rentabilidade por viagem',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/10 to-blue-600/10 rounded-2xl blur-2xl" />
              <img
                src={mockupDashboard}
                alt="Sistema de gestão"
                className="relative rounded-2xl shadow-2xl border border-border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial / Trust */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Lock, title: 'Seguro', desc: 'Autenticação robusta, criptografia de dados, controle de acesso por roles e logs de auditoria completos.' },
              { icon: Smartphone, title: 'Responsivo', desc: 'Acesse de qualquer dispositivo — computador, tablet ou celular. O sistema se adapta perfeitamente.' },
              { icon: HeadphonesIcon, title: 'Suporte', desc: 'Suporte técnico dedicado para tirar dúvidas, resolver problemas e ajudar na configuração inicial.' },
            ].map((item, i) => (
              <Card key={i} className="border-border text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <item.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">FAQ</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Perguntas Frequentes
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contato" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-sky-500/10 to-blue-600/10 rounded-3xl blur-3xl" />
            <div className="relative bg-card border border-border rounded-3xl p-12 md:p-16 shadow-2xl">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Plane className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Pronto para transformar sua agência?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Entre em contato e agende uma demonstração gratuita. Veja na prática como o Fly Sistema pode revolucionar a gestão da sua agência de turismo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/5581999999999?text=Olá! Gostaria de conhecer o Fly Sistema para minha agência de turismo."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-primary-foreground shadow-xl text-lg px-8 h-14">
                    <MessageSquare className="w-5 h-5 mr-2" /> Falar no WhatsApp
                  </Button>
                </a>
                <a href="mailto:contato@flyturismo.com">
                  <Button size="lg" variant="outline" className="h-14 text-lg px-8">
                    Enviar E-mail
                  </Button>
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                <Star className="w-4 h-4 inline text-amber-500 mr-1" />
                Demonstração gratuita e sem compromisso
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md">
                <img src={logoFly} alt="Fly Turismo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                  Fly Sistema
                </span>
                <p className="text-xs text-muted-foreground">Sistema de Gestão para Turismo</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Fly Sistema. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
