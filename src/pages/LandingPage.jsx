import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import logoAgencia from '@/assets/logo-agencia-sistema.png';
import mockupDashboard from '@/assets/mockup-dashboard-pt.jpg';
import mockupAssentos from '@/assets/mockup-assentos-pt.jpg';
import mockupFinanceiro from '@/assets/mockup-financeiro-pt.jpg';
import testimonialBg from '@/assets/testimonial-bg.jpg';
import demoVideo from '@/assets/demo-video.mp4';
import {
  Plane, Users, CreditCard, Bus, Calendar, FileText, BarChart3,
  Shield, Clock, CheckCircle2, Star,
  MessageSquare, Settings, Bell, Download, Globe,
  ChevronDown, ChevronUp, Menu, X, Target, Award, HeadphonesIcon,
  ClipboardList, Hotel, Receipt, TrendingUp, Lock, Play,
  Sparkles, BadgeCheck, Timer, Gift,
  ThumbsUp, Quote, Monitor, TabletSmartphone, Wifi,
  RefreshCw, LayoutDashboard, PieChart, Eye,
  CalendarCheck, Handshake, Send,
  Heart, Flame, Rocket, Moon, Sun, TrendingDown, Percent, Hourglass
} from 'lucide-react';

const BRAND = 'Agência Sistema';
const WHATSAPP_LINK = 'https://wa.me/5581999999999?text=Olá! Gostaria de agendar uma demonstração gratuita do Agência Sistema.';

// ─── Animation wrapper ─────────────────────────────────────────────
function FadeIn({ children, className, delay = 0, direction = 'up' }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const dirs = { up: [30, 0], down: [-30, 0], left: [30, 0], right: [-30, 0] };
  const y = direction === 'up' || direction === 'down' ? dirs[direction] : [0, 0];
  const x = direction === 'left' || direction === 'right' ? dirs[direction] : [0, 0];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: y[0], x: x[0] }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ───────────────────────────────────────────────────────────
const features = [
  { icon: Users, title: 'Gestão de Clientes Completa', desc: 'Cadastro com CPF, endereço, grupos familiares, crianças de colo, histórico de viagens e importação em massa.', color: 'from-blue-500 to-cyan-500' },
  { icon: Plane, title: 'Controle Total de Viagens', desc: 'Crie e gerencie viagens com destinos, datas, 3 faixas de valores, vagas, múltiplas imagens e status em tempo real.', color: 'from-amber-500 to-orange-500' },
  { icon: Bus, title: 'Mapa de Assentos Interativo', desc: '5 layouts de ônibus diferentes (Double Deck, JG Turismo, Deca Turismo e mais). Seleção visual de poltronas.', color: 'from-emerald-500 to-teal-500' },
  { icon: CreditCard, title: 'Financeiro Inteligente', desc: 'Parcelas automáticas, recebimentos, despesas pessoais e empresariais. Alertas de vencimento e relatórios.', color: 'from-violet-500 to-purple-500' },
  { icon: FileText, title: 'Contratos com Assinatura Digital', desc: 'Geração automática de contratos PDF com assinatura digital validada por CPF e IP. Link compartilhável.', color: 'from-rose-500 to-pink-500' },
  { icon: Hotel, title: 'Mapa de Quartos e Hospedagem', desc: 'Distribua hóspedes por quartos com controle de capacidade, tipos de cama e ocupação visual.', color: 'from-cyan-500 to-blue-500' },
  { icon: Calendar, title: 'Calendário Visual de Viagens', desc: 'Todas as viagens em um calendário interativo com cores por status. Planejamento visual completo.', color: 'from-indigo-500 to-violet-500' },
  { icon: BarChart3, title: 'Relatórios e Rentabilidade', desc: 'Análise detalhada de receitas x despesas por viagem, margem de lucro e gráficos comparativos.', color: 'from-pink-500 to-rose-500' },
  { icon: ClipboardList, title: 'Check-in e Embarque', desc: 'Lista digital com confirmação de presença, local de embarque e status em tempo real.', color: 'from-orange-500 to-red-500' },
  { icon: Receipt, title: 'Recibos PDF Automáticos', desc: 'Gere recibos profissionais em PDF com dados do pagamento, cliente e viagem. 1 clique.', color: 'from-teal-500 to-emerald-500' },
  { icon: MessageSquare, title: 'WhatsApp Integrado', desc: 'Templates prontos para cobrança, confirmação e lembretes via WhatsApp direto do sistema.', color: 'from-green-500 to-emerald-500' },
  { icon: Shield, title: 'Segurança e Auditoria', desc: 'Roles (Admin/Funcionário), permissões granulares, logs completos e autenticação segura.', color: 'from-slate-500 to-gray-600' },
];

const modules = [
  { icon: LayoutDashboard, name: 'Dashboard' }, { icon: Plane, name: 'Viagens' },
  { icon: Users, name: 'Clientes' }, { icon: Bus, name: 'Assentos' },
  { icon: Hotel, name: 'Quartos' }, { icon: CreditCard, name: 'Financeiro' },
  { icon: Receipt, name: 'Recebimentos' }, { icon: FileText, name: 'Contratos' },
  { icon: Calendar, name: 'Calendário' }, { icon: ClipboardList, name: 'Check-in' },
  { icon: TrendingUp, name: 'Rentabilidade' }, { icon: PieChart, name: 'Relatórios' },
  { icon: Download, name: 'Exportação' }, { icon: MessageSquare, name: 'WhatsApp' },
  { icon: Bell, name: 'Notificações' }, { icon: Settings, name: 'Configurações' },
  { icon: Eye, name: 'Auditoria' }, { icon: Globe, name: 'Portal Público' },
];

const faqs = [
  { q: 'O sistema funciona em celular e tablet?', a: 'Sim! 100% responsivo em smartphones, tablets e desktops.' },
  { q: 'Preciso instalar algo?', a: 'Não! Roda na nuvem pelo navegador. Sem instalações.' },
  { q: 'Quantos usuários podem acessar?', a: 'Ilimitados! Suporte a múltiplos usuários com diferentes níveis de acesso.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim! Criptografia, infraestrutura AWS, autenticação segura, controle de acesso e logs de auditoria.' },
  { q: 'Posso personalizar com minha marca?', a: 'Configure logo, cores, slogan, contato e redes sociais. O sistema fica com a cara da sua agência.' },
  { q: 'Como funciona o contrato digital?', a: 'Geração automática de PDF com assinatura digital validada por CPF e IP. O cliente assina online por link.' },
  { q: 'A demonstração é gratuita?', a: 'Totalmente! Mostramos o sistema ao vivo, tiramos dúvidas e você decide com calma. Sem compromisso.' },
  { q: 'Posso importar meus clientes?', a: 'Sim! Importação em massa via JSON. Traga toda sua base sem cadastrar um por um.' },
];

const testimonials = [
  { name: 'Carlos M.', role: 'Dono de Agência - SP', text: 'O sistema transformou minha agência. Antes eu fazia tudo em planilhas, agora tenho controle total em um só lugar.', stars: 5 },
  { name: 'Ana Paula S.', role: 'Gestora de Turismo - MG', text: 'O mapa de assentos e o controle financeiro são incríveis. Economizo horas por semana com a automação.', stars: 5 },
  { name: 'Roberto L.', role: 'Agência de Excursões - PE', text: 'Melhor investimento que fiz! O sistema é intuitivo e resolve TODOS os problemas que eu tinha.', stars: 5 },
  { name: 'Fernanda R.', role: 'Operadora de Turismo - RJ', text: 'Testei 3 sistemas antes e nenhum era pra turismo rodoviário de verdade. Esse entende o que a gente precisa.', stars: 5 },
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

// ─── Components ─────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors">
        <span className="font-semibold text-foreground pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-5 pb-5 text-muted-foreground leading-relaxed">{a}</motion.div>}
    </div>
  );
}

function LeadForm({ variant = 'default' }) {
  const [form, setForm] = useState({ nome: '', telefone: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = `Olá! Meu nome é ${form.nome}. Gostaria de agendar uma demonstração gratuita do Agência Sistema.\n\nE-mail: ${form.email}\nTelefone: ${form.telefone}`;
    window.open(`https://wa.me/5581999999999?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmitted(true);
  };
  if (submitted) {
    return (
      <div className="text-center py-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Perfeito! 🎉</h3>
        <p className="text-muted-foreground">Você será redirecionado para o WhatsApp. Nossa equipe vai agendar sua demonstração em até 2 horas!</p>
      </div>
    );
  }
  const isHero = variant === 'hero';
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input placeholder="Seu nome completo" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={isHero ? 'h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50' : 'h-12'} />
      <Input placeholder="WhatsApp (ex: 81 99999-9999)" required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className={isHero ? 'h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50' : 'h-12'} />
      <Input type="email" placeholder="Seu melhor e-mail" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={isHero ? 'h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50' : 'h-12'} />
      <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl shadow-emerald-500/25">
        <CalendarCheck className="w-5 h-5 mr-2" /> Agendar Demonstração Grátis
      </Button>
      <p className={`text-xs text-center ${isHero ? 'text-white/50' : 'text-muted-foreground'}`}>
        <Lock className="w-3 h-3 inline mr-1" /> Seus dados estão seguros. Sem spam.
      </p>
    </form>
  );
}

function CountdownTimer() {
  const [time, setTime] = useState({ h: 23, m: 59, s: 59 });
  useEffect(() => {
    const saved = sessionStorage.getItem('lp-countdown');
    if (saved) {
      const t = JSON.parse(saved);
      setTime(t);
    }
    const interval = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        const next = { h, m, s };
        sessionStorage.setItem('lp-countdown', JSON.stringify(next));
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center justify-center gap-3">
      {[
        { v: pad(time.h), l: 'Horas' },
        { v: pad(time.m), l: 'Min' },
        { v: pad(time.s), l: 'Seg' },
      ].map((t, i) => (
        <div key={i} className="text-center">
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 text-3xl md:text-4xl font-extrabold font-mono tabular-nums">{t.v}</div>
          <span className="text-xs text-white/60 mt-1 block">{t.l}</span>
        </div>
      ))}
    </div>
  );
}

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Olá! 👋 Sou da equipe do Agência Sistema. Como posso ajudar você hoje?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: `Obrigado pela mensagem! Para uma conversa mais rápida, fale com nosso time diretamente pelo WhatsApp. Vou te redirecionar! 😊` }]);
      setTimeout(() => {
        window.open(`https://wa.me/5581999999999?text=${encodeURIComponent(`Olá! ${userMsg}`)}`, '_blank');
      }, 2000);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoAgencia} alt="" className="w-8 h-8 rounded-full object-contain bg-white/20 p-1" />
              <div>
                <p className="text-white font-bold text-sm">{BRAND}</p>
                <p className="text-white/70 text-xs">Online agora</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${m.from === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border text-foreground rounded-bl-md'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Digite sua mensagem..." className="h-10 text-sm" />
            <Button type="submit" size="icon" className="h-10 w-10 bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex-shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      )}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-2xl shadow-blue-500/30 flex items-center justify-center"
      >
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const navItems = ['Funcionalidades', 'Módulos', 'Resultados', 'Depoimentos', 'FAQ'];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ChatWidget />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={logoAgencia} alt={BRAND} className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{BRAND}</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {navItems.map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">{item}</a>
              ))}
              <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <a href="#agendar">
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg">
                  <CalendarCheck className="w-4 h-4 mr-2" /> Agendar Demo
                </Button>
              </a>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button className="p-2" onClick={() => setMobileMenu(!mobileMenu)}>
                {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-background border-t border-border px-4 py-4 space-y-3">
            {navItems.map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="block py-2 text-muted-foreground hover:text-foreground font-medium">{item}</a>
            ))}
            <a href="#agendar" onClick={() => setMobileMenu(false)}>
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white"><CalendarCheck className="w-4 h-4 mr-2" /> Agendar Demo</Button>
            </a>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, hsl(200 80% 60%) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(180 80% 50%) 0%, transparent 50%)' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">+200 agências já testaram gratuitamente</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-white">
                Sua agência no{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">piloto automático</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100/80 mb-8 leading-relaxed">
                Viagens, clientes, assentos, quartos, financeiro, contratos, WhatsApp e muito mais —
                <strong className="text-white"> tudo em um só lugar</strong>. Pare de usar planilhas e comece a crescer.
              </p>
              <div className="flex flex-wrap items-center gap-6 mb-8">
                {['100% na nuvem', 'Sem cartão de crédito', 'Demo personalizada', 'Suporte dedicado'].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm text-blue-200/80">{text}</span>
                  </div>
                ))}
              </div>
              <div className="lg:hidden mb-8">
                <img src={mockupDashboard} alt={`Dashboard ${BRAND}`} className="rounded-2xl shadow-2xl border border-white/10" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} id="agendar">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-2xl blur-3xl" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
                    <Gift className="w-3 h-3" /> TESTE GRATUITO
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-2">Agende sua demonstração</h3>
                  <p className="text-blue-200/70 text-sm">Veja o sistema ao vivo, sem compromisso</p>
                </div>
                <LeadForm variant="hero" />
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-blue-300/60 text-xs animate-bounce">
          <ChevronDown className="w-4 h-4" /> Role para descobrir mais
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-6 bg-gradient-to-r from-blue-500 to-cyan-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-white">
            {[{ value: '18+', label: 'Módulos' }, { value: '200+', label: 'Agências Testaram' }, { value: '99.9%', label: 'Uptime' }, { value: '5★', label: 'Nota dos Clientes' }].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold">{stat.value}</div>
                <div className="text-white/80 text-xs font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <FadeIn>
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Play className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Veja na Prática</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Conheça o sistema em 60 segundos</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Assista uma prévia do que o {BRAND} pode fazer pela sua agência</p>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-muted aspect-video">
              <video
                src={demoVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      </FadeIn>

      {/* What you get */}
      <FadeIn>
        <section className="py-20 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                O que você recebe na <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">demonstração gratuita</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Não é só uma apresentação — é uma consultoria personalizada</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Monitor, title: 'Demo Ao Vivo', desc: 'Sistema funcionando com dados reais de viagens e clientes', color: 'from-blue-500 to-cyan-500' },
                { icon: Handshake, title: 'Consultoria Grátis', desc: 'Analisamos seu fluxo e mostramos como otimizar', color: 'from-amber-500 to-orange-500' },
                { icon: Settings, title: 'Setup Personalizado', desc: 'Configuramos com sua marca, logo e cores', color: 'from-emerald-500 to-green-500' },
                { icon: HeadphonesIcon, title: 'Suporte Dedicado', desc: 'Acompanhamento nos primeiros dias', color: 'from-violet-500 to-purple-500' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <Card className="border-border text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <item.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Pain Points */}
      <FadeIn>
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Você ainda gerencia sua agência assim?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Se você se identificou, o {BRAND} é para você.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { emoji: '📋', pain: 'Planilhas infinitas do Excel', solution: 'Dashboard inteligente centralizado' },
                { emoji: '😰', pain: 'Medo de perder dados', solution: 'Banco de dados seguro na nuvem' },
                { emoji: '📱', pain: 'WhatsApp desorganizado', solution: 'Templates prontos integrados' },
                { emoji: '📝', pain: 'Contratos feitos à mão', solution: 'Contratos PDF com assinatura digital' },
                { emoji: '🪑', pain: 'Mapa de assentos no papel', solution: 'Seleção visual interativa de poltronas' },
                { emoji: '💸', pain: 'Não sabe se deu lucro', solution: 'Rentabilidade automática por viagem' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <Card className="border-border overflow-hidden group hover:shadow-xl transition-all duration-300 h-full">
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
                </FadeIn>
              ))}
            </div>
            <div className="text-center mt-12">
              <a href="#agendar">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl h-14 text-lg px-10 font-bold">
                  <Rocket className="w-5 h-5 mr-2" /> Quero Resolver Isso — Agendar Demo
                </Button>
              </a>
              <p className="text-xs text-muted-foreground mt-3">Gratuito • Sem compromisso • 30 min</p>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Results / Numbers */}
      <section id="resultados" className="py-24 bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">Resultados Reais</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Números que nossas agências alcançam
              </h2>
              <p className="text-lg text-blue-200/70 max-w-2xl mx-auto">
                Dados reais de agências que migraram do Excel para o {BRAND}
              </p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Hourglass, value: '15h', suffix: '/semana', label: 'Economizadas em trabalho manual', color: 'from-cyan-400 to-blue-400' },
              { icon: TrendingDown, value: '90%', suffix: '', label: 'Menos erros em contratos e cobranças', color: 'from-emerald-400 to-green-400' },
              { icon: Percent, value: '40%', suffix: '', label: 'Aumento na taxa de conversão de leads', color: 'from-amber-400 to-orange-400' },
              { icon: TrendingUp, value: '3x', suffix: '', label: 'Mais organização financeira por viagem', color: 'from-violet-400 to-purple-400' },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl md:text-5xl font-extrabold mb-1">
                    <span className={`bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>{item.value}</span>
                    <span className="text-lg text-blue-300/60">{item.suffix}</span>
                  </div>
                  <p className="text-blue-200/70 text-sm">{item.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.4}>
            <div className="text-center mt-12">
              <a href="#agendar">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-xl h-14 text-lg px-10 font-bold">
                  <Sparkles className="w-5 h-5 mr-2" /> Quero Esses Resultados — Agendar Demo Grátis
                </Button>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">12 Funcionalidades Poderosas</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Tudo que sua agência precisa — e mais</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Construída ouvindo agências reais. Nada genérico.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <Card className="group border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <f.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-foreground">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <FadeIn>
        <section id="módulos" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Ecossistema Completo</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">+18 módulos 100% integrados</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Todos conversam entre si. Cadastre uma viagem e tudo fica conectado.</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-4">
              {modules.map((m, i) => (
                <motion.div key={i} whileHover={{ y: -4 }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all group cursor-default">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center group-hover:from-blue-500 group-hover:to-cyan-500 transition-all">
                    <m.icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{m.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Multi-device Section */}
      <FadeIn>
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Feito para Turismo Rodoviário</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
                  Acesse de <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">qualquer dispositivo</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8">Desktop, tablet ou celular — seu sistema funciona perfeito em qualquer tela, a qualquer hora, de qualquer lugar.</p>
                <div className="space-y-3 mb-8">
                  {[
                    'Mapa de assentos para 5 modelos de ônibus DD',
                    'Contratos com assinatura digital por CPF',
                    'Parcelas com alertas automáticos',
                    'Portal público para inscrições online',
                    'Recibos PDF profissionais com 1 clique',
                    'WhatsApp integrado para cobrança',
                    'Quartos com controle inteligente',
                    'Dashboard com rentabilidade por viagem',
                    'Check-in digital no embarque',
                    'Facebook Ads integrado',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <a href="#agendar">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg h-12 px-8 font-bold">
                    <Play className="w-5 h-5 mr-2" /> Ver Funcionando — Grátis
                  </Button>
                </a>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-2xl" />
                <motion.img whileHover={{ scale: 1.02 }} src={mockupFinanceiro} alt="Sistema financeiro multi dispositivo" className="relative rounded-2xl shadow-2xl border border-border" />
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Mid CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
            <CalendarCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Reunião Online de 30 Minutos</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Quer ver o sistema ao vivo?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">Agende uma reunião gratuita. Mostramos tudo e <strong>configuramos na hora</strong>.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#agendar">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 shadow-xl text-lg px-10 h-14 font-bold w-full sm:w-auto">
                <CalendarCheck className="w-5 h-5 mr-2" /> Agendar Reunião Grátis
              </Button>
            </a>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-14 text-lg px-8 w-full sm:w-auto">
                <MessageSquare className="w-5 h-5 mr-2" /> WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <FadeIn>
        <section id="comparativo" className="py-24 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Comparativo</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Por que escolher o {BRAND}?</h2>
            </div>
            <Card className="overflow-hidden border-border shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-4 font-semibold text-foreground">Funcionalidade</th>
                      <th className="text-center p-4 font-semibold"><span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{BRAND}</span></th>
                      <th className="text-center p-4 font-semibold text-muted-foreground">Outros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonItems.map((item, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-4 text-sm text-foreground">{item.feature}</td>
                        <td className="p-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /></td>
                        <td className="p-4 text-center">
                          {item.others === true ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : item.others === 'Parcial' ? <span className="text-xs text-amber-500 font-medium">Parcial</span> : <X className="w-5 h-5 text-destructive/50 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>
      </FadeIn>

      {/* How it works */}
      <FadeIn>
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Super Simples</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Da demo ao uso em 4 passos</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', icon: CalendarCheck, title: 'Agende a Demo', desc: 'Preencha o formulário e agendamos em até 2h.', color: 'from-emerald-500 to-green-500' },
                { step: '02', icon: Monitor, title: 'Veja Ao Vivo', desc: 'Mostramos o sistema com dados reais.', color: 'from-blue-500 to-cyan-500' },
                { step: '03', icon: Settings, title: 'Configuramos', desc: 'Sua marca, logo, cores e clientes importados.', color: 'from-amber-500 to-orange-500' },
                { step: '04', icon: Rocket, title: 'Comece a Usar', desc: 'Acesso liberado com suporte dedicado!', color: 'from-violet-500 to-purple-500' },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.15}>
                  <div className="text-center group">
                    <div className="text-7xl font-extrabold text-muted/30 mb-4 group-hover:text-primary/20 transition-colors">{item.step}</div>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-xl`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Testimonials */}
      <FadeIn>
        <section id="depoimentos" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={testimonialBg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background/90" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Quem usa, aprova</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">O que dizem nossos clientes</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((t, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <Card className="border-border hover:shadow-xl transition-all h-full">
                    <CardContent className="p-6">
                      <Quote className="w-8 h-8 text-cyan-500/30 mb-4" />
                      <p className="text-foreground mb-4 leading-relaxed text-sm">"{t.text}"</p>
                      <div className="flex items-center gap-1 mb-3">
                        {Array(t.stars).fill(0).map((_, j) => (
                          <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="font-bold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </CardContent>
                  </Card>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Trust */}
      <FadeIn>
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Lock, title: 'Dados Seguros', desc: 'Criptografia e backup na nuvem AWS' },
                { icon: TabletSmartphone, title: '100% Responsivo', desc: 'Celular, tablet e desktop' },
                { icon: RefreshCw, title: 'Atualizações Grátis', desc: 'Novas funções sem custo' },
                { icon: HeadphonesIcon, title: 'Suporte Humano', desc: 'WhatsApp e e-mail reais' },
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
      </FadeIn>

      {/* FAQ */}
      <FadeIn>
        <section id="faq" className="py-24 bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Dúvidas</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Perguntas Frequentes</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Urgency with Countdown */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Timer className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Oferta expira em breve</h2>
          <p className="text-xl text-white/90 mb-8">
            Setup personalizado + suporte dedicado <strong>grátis</strong> para as próximas <strong>10 agências</strong>
          </p>
          <CountdownTimer />
          <div className="mt-8">
            <a href="#agendar">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 shadow-xl text-lg px-10 h-14 font-bold">
                <CalendarCheck className="w-5 h-5 mr-2" /> Garantir Minha Vaga
              </Button>
            </a>
          </div>
          <p className="text-sm text-white/60 mt-4">100% gratuito e sem compromisso</p>
        </div>
      </section>

      {/* Final CTA */}
      <FadeIn>
        <section id="contato" className="py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-3xl blur-3xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8 md:p-16 shadow-2xl">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <img src={logoAgencia} alt={BRAND} className="w-16 h-16 mb-6 object-contain" />
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Pronto para transformar sua agência?</h2>
                    <p className="text-lg text-muted-foreground mb-6">Em 30 minutos você vai entender por que agências estão migrando para o {BRAND}.</p>
                    <div className="space-y-4">
                      {[
                        { icon: CalendarCheck, text: 'Demo ao vivo de 30 minutos' },
                        { icon: Settings, text: 'Setup com sua marca incluso' },
                        { icon: HeadphonesIcon, text: 'Suporte dedicado nos primeiros dias' },
                        { icon: Gift, text: 'Teste gratuito sem cartão' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <LeadForm />
                    <div className="mt-6 text-center">
                      <p className="text-xs text-muted-foreground mb-3">Ou fale direto:</p>
                      <div className="flex gap-3 justify-center">
                        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm"><MessageSquare className="w-4 h-4 mr-2 text-emerald-500" /> WhatsApp</Button>
                        </a>
                        <a href="mailto:contato@agenciasistema.com.br">
                          <Button variant="outline" size="sm"><Wifi className="w-4 h-4 mr-2 text-blue-500" /> E-mail</Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoAgencia} alt={BRAND} className="w-10 h-10 object-contain" />
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{BRAND}</span>
                  <p className="text-xs text-muted-foreground">Sistema para Agências de Turismo</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">A plataforma mais completa do Brasil para gestão de agências de turismo rodoviário.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">Navegação</h4>
              <ul className="space-y-2 text-sm">
                {navItems.map(item => (
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
