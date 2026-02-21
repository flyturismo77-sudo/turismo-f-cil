import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plane, MapPin, Calendar, Users, Plus, Minus, CheckCircle,
  Loader2, XCircle, ChevronRight, ChevronLeft, User, Home,
  CreditCard, Baby, Phone, Mail, FileText, Clock, Star,
  ArrowRight, Shield, Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoFly from '@/assets/logo-fly-turismo.jpg';

const SUPABASE_URL = "https://duzfdwkjqqsayisfllww.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1emZkd2tqcXFzYXlpc2ZsbHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzI4ODksImV4cCI6MjA4NjQwODg4OX0.DKdBuaeaPunvxh_gawqaDHva3nOI0Qcbvby6zMV_8PA";

const STEPS = [
  { id: 1, title: 'Viagem',    icon: Plane },
  { id: 2, title: 'Pessoais',  icon: User },
  { id: 3, title: 'Endereço',  icon: Home },
  { id: 4, title: 'Pagamento', icon: CreditCard },
  { id: 5, title: 'Grupo',     icon: Users },
  { id: 6, title: 'Resumo',    icon: CheckCircle },
];

const formatCPF = (v) => v.replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
const formatPhone = (v) => { const d=v.replace(/\D/g,'').slice(0,11); return d.length<=10?d.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3').replace(/-$/,''):d.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3').replace(/-$/,''); };
const formatCEP = (v) => v.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d{0,3})/,'$1-$2').replace(/-$/,'');

const buscarCEP = async (cep) => {
  const d = cep.replace(/\D/g,'');
  if (d.length !== 8) return null;
  try { const r = await fetch(`https://viacep.com.br/ws/${d}/json/`); const data = await r.json(); return data.erro ? null : data; } catch { return null; }
};

// ── Field component ──────────────────────────────────────────────
const Field = ({ label, required, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    <Label className="text-sm font-semibold text-foreground/80">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

// ── Section Header ───────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-1">
      <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-2xl font-display font-bold text-foreground">{title}</h2>
    </div>
    {subtitle && <p className="text-muted-foreground text-sm ml-13 pl-[52px]">{subtitle}</p>}
  </div>
);

// ── Card Section ─────────────────────────────────────────────────
const FormSection = ({ children, className = '' }) => (
  <div className={`bg-card rounded-2xl border border-border shadow-elevated p-6 ${className}`}>
    {children}
  </div>
);

export default function InscricaoViagem() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('idle');
  const [loadingCep, setLoadingCep] = useState(false);
  const [passageiros, setPassageiros] = useState([]);
  const [formData, setFormData] = useState({
    id_viagem: '', nome_completo: '', rg: '', cpf: '',
    sexo: '', estado_civil: '', data_nascimento: '',
    email: '', telefone: '',
    cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    forma_pagamento: 'À Vista', numero_parcelas: 1, dia_vencimento: 10,
    possui_crianca_colo: false, nome_crianca_colo: '', idade_crianca_colo: 0,
    desconto: 0,
  });

  const { data: viagens = [], isLoading: loadingViagens } = useQuery({
    queryKey: ['viagens-publicas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('viagens').select('*').eq('arquivada', false).order('data_saida', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const { data: formulario, error } = await supabase.from('formularios_contrato').insert(payload).select().single();
      if (error) throw error;
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({ to: payload.email, subject: '✈️ Fly Turismo – Formulário recebido!', body: `Olá, ${payload.nome_completo}!\n\nRecebemos seu formulário. Nossa equipe entrará em contato em breve.\n\nFly Turismo ✈️` }),
        });
      } catch (_) {}
      try {
        const v = viagens.find(x => x.id === payload.id_viagem);
        await fetch(`${SUPABASE_URL}/functions/v1/notificar-inscricao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({ nome_cliente: payload.nome_completo, telefone: payload.telefone, email: payload.email, viagem_nome: v?.nome || '', viagem_destino: v?.destino || '', forma_pagamento: payload.forma_pagamento, numero_parcelas: payload.numero_parcelas, total_passageiros: (payload.passageiros?.length || 0) + 1 }),
        });
      } catch (_) {}
      return formulario;
    },
    onSuccess: () => { setStatus('success'); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    onError: () => { setStatus('error'); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  });

  const viagemSelecionada = viagens.find(v => v.id === formData.id_viagem);
  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleCepBlur = async (cep) => {
    setLoadingCep(true);
    const addr = await buscarCEP(cep);
    if (addr) setFormData(prev => ({ ...prev, rua: addr.logradouro || prev.rua, bairro: addr.bairro || prev.bairro, cidade: addr.localidade || prev.cidade, estado: addr.uf || prev.estado }));
    setLoadingCep(false);
  };

  const adicionarPassageiro = () => setPassageiros(prev => [...prev, { nome_completo: '', cpf: '', telefone: '', data_nascimento: '', sexo: '' }]);
  const removerPassageiro = (i) => setPassageiros(prev => prev.filter((_, idx) => idx !== i));
  const updatePassageiro = (i, field, value) => setPassageiros(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: value }; return n; });

  const canProceed = () => {
    if (step === 1) return !!formData.id_viagem;
    if (step === 2) return !!(formData.nome_completo && formData.cpf && formData.sexo && formData.data_nascimento && formData.telefone && formData.email);
    if (step === 3) return !!(formData.rua && formData.numero && formData.bairro && formData.cidade);
    if (step === 4) return !!formData.forma_pagamento;
    return true;
  };

  const handleSubmit = () => submitMutation.mutate({ ...formData, passageiros: passageiros.filter(p => p.nome_completo), status: 'Pendente' });

  // ── SUCCESS ──────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="w-24 h-24 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-primary">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Inscrição Enviada!</h1>
          <p className="text-muted-foreground mb-8">
            Obrigado, <strong className="text-foreground">{formData.nome_completo}</strong>! Sua inscrição para <strong className="text-primary">{viagemSelecionada?.nome}</strong> foi recebida com sucesso.
          </p>
          <div className="bg-card rounded-2xl border border-border shadow-elevated p-6 mb-8 text-left space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <img src={logoFly} alt="Fly Turismo" className="w-8 h-8 rounded-full object-cover" />
              <span className="font-display font-bold text-foreground">Fly Turismo</span>
            </div>
            {[
              ['Viagem', viagemSelecionada?.nome],
              ['Destino', viagemSelecionada?.destino],
              ['Passageiros', `${passageiros.length + 1} pessoa(s)`],
              ['Pagamento', `${formData.forma_pagamento}${formData.forma_pagamento === 'Parcelado' ? ` em ${formData.numero_parcelas}x` : ''}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-semibold text-foreground">{v}</span>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-border text-xs text-muted-foreground text-center">
              📧 Confirmação enviada para <strong>{formData.email}</strong>
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-4 text-sm text-primary/80 mb-6">
            <Phone className="w-4 h-4 inline mr-1" /> Nossa equipe entrará em contato pelo WhatsApp em breve.
          </div>
          <button onClick={() => { setStatus('idle'); setStep(1); setFormData(f => ({ ...f, id_viagem: '', nome_completo: '', cpf: '' })); }} className="text-sm text-muted-foreground hover:text-primary underline">
            Fazer nova inscrição
          </button>
        </div>
      </div>
    );
  }

  // ── ERROR ────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Algo deu errado</h2>
          <p className="text-muted-foreground mb-6">Não foi possível enviar. Tente novamente ou ligue: <strong>(38) 9755-2155</strong></p>
          <Button onClick={() => setStatus('idle')} className="gradient-primary text-white">Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  // ── MAIN ─────────────────────────────────────────────────────
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4">
          {/* Brand */}
          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <img src={logoFly} alt="Fly Turismo" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
              <div>
                <p className="font-display font-bold text-sm text-foreground leading-tight">Fly Turismo</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Formulário de Inscrição</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
              <Shield className="w-3 h-3 text-primary" />
              Dados protegidos
            </div>
          </div>

          {/* Stepper */}
          <div className="py-3">
            <div className="flex items-center gap-1 mb-2">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                const isDone = step > s.id;
                return (
                  <React.Fragment key={s.id}>
                    <button
                      type="button"
                      onClick={() => isDone && setStep(s.id)}
                      className={`flex flex-col items-center gap-0.5 min-w-[44px] transition-all ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'gradient-primary shadow-glow-primary scale-110' :
                        isDone ? 'bg-primary/20 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-[9px] font-semibold hidden sm:block transition-colors ${isActive ? 'text-primary' : isDone ? 'text-primary/70' : 'text-muted-foreground'}`}>
                        {s.title}
                      </span>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 rounded-full overflow-hidden bg-border">
                        <div className={`h-full rounded-full transition-all duration-500 gradient-primary ${isDone ? 'w-full' : 'w-0'}`} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">

        {/* ── STEP 1: Viagem ── */}
        {step === 1 && (
          <div>
            <SectionHeader icon={Plane} title="Escolha sua Viagem" subtitle="Selecione a viagem para a qual deseja se inscrever" />
            {loadingViagens ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Buscando viagens disponíveis...</p>
              </div>
            ) : viagens.length === 0 ? (
              <FormSection className="text-center py-16">
                <Plane className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="font-display font-bold text-lg text-foreground mb-1">Nenhuma viagem disponível</p>
                <p className="text-sm text-muted-foreground">Aguarde novas viagens ou entre em contato: <strong>(38) 9755-2155</strong></p>
              </FormSection>
            ) : (
              <div className="space-y-3">
                {viagens.map(viagem => {
                  const selected = formData.id_viagem === viagem.id;
                  
                  const imgSrc = (viagem.imagens_urls?.length > 0 ? viagem.imagens_urls[0] : null) || viagem.imagem_url;
                  return (
                    <button
                      key={viagem.id}
                      type="button"
                      onClick={() => update('id_viagem', viagem.id)}
                      className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                        selected
                          ? 'border-primary ring-4 ring-primary/10 shadow-glow-primary bg-card'
                          : 'border-border bg-card hover:border-primary/40 hover:shadow-elevated'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div className="sm:w-44 h-40 sm:h-auto flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                          {imgSrc ? (
                            <img src={imgSrc} alt={viagem.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Plane className="w-16 h-16 text-primary/20" />
                            </div>
                          )}
                          {selected && (
                            <div className="absolute top-2 right-2 w-7 h-7 gradient-primary rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <h3 className="font-display font-bold text-lg text-foreground leading-tight">{viagem.nome}</h3>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground mb-4">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                {viagem.destino}
                              </span>
                              {viagem.data_saida && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-primary" />
                                  {format(new Date(viagem.data_saida + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                                  {viagem.data_retorno && ` → ${format(new Date(viagem.data_retorno + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}`}
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Dados Pessoais ── */}
        {step === 2 && (
          <div>
            <SectionHeader icon={User} title="Seus Dados Pessoais" subtitle="Preencha seus dados conforme o documento de identidade" />
            <FormSection>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Nome Completo" required className="md:col-span-2">
                  <Input value={formData.nome_completo} onChange={e => update('nome_completo', e.target.value)} placeholder="Como consta no RG/CPF" />
                </Field>
                <Field label="RG">
                  <Input value={formData.rg} onChange={e => update('rg', e.target.value)} placeholder="Opcional" />
                </Field>
                <Field label="CPF" required>
                  <Input value={formData.cpf} onChange={e => update('cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" />
                </Field>
                <Field label="Sexo" required>
                  <Select value={formData.sexo} onValueChange={v => update('sexo', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Estado Civil">
                  <Select value={formData.estado_civil} onValueChange={v => update('estado_civil', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Data de Nascimento" required>
                  <Input type="date" value={formData.data_nascimento} onChange={e => update('data_nascimento', e.target.value)} />
                </Field>
                <Field label="WhatsApp" required>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" value={formData.telefone} onChange={e => update('telefone', formatPhone(e.target.value))} placeholder="(38) 99999-9999" />
                  </div>
                </Field>
                <Field label="E-mail" required className="md:col-span-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" type="email" value={formData.email} onChange={e => update('email', e.target.value)} placeholder="seuemail@exemplo.com" />
                  </div>
                </Field>
              </div>

              {/* Criança de colo */}
              <div className="mt-6 pt-6 border-t border-border">
                <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.possui_crianca_colo ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  <input
                    type="checkbox"
                    checked={formData.possui_crianca_colo}
                    onChange={e => update('possui_crianca_colo', e.target.checked)}
                    className="w-4 h-4 accent-[hsl(var(--primary))]"
                  />
                  <div className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">Vou levar uma criança de colo (0–2 anos)</span>
                  </div>
                </label>
                {formData.possui_crianca_colo && (
                  <div className="grid md:grid-cols-2 gap-4 mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <Field label="Nome da Criança">
                      <Input value={formData.nome_crianca_colo} onChange={e => update('nome_crianca_colo', e.target.value)} />
                    </Field>
                    <Field label="Idade (meses)">
                      <Input type="number" min={0} max={24} value={formData.idade_crianca_colo} onChange={e => update('idade_crianca_colo', parseInt(e.target.value) || 0)} />
                    </Field>
                  </div>
                )}
              </div>
            </FormSection>
          </div>
        )}

        {/* ── STEP 3: Endereço ── */}
        {step === 3 && (
          <div>
            <SectionHeader icon={Home} title="Endereço" subtitle="Digite o CEP para preencher automaticamente" />
            <FormSection>
              <div className="grid md:grid-cols-3 gap-5">
                <Field label="CEP">
                  <div className="relative">
                    <Input
                      value={formData.cep}
                      onChange={e => update('cep', formatCEP(e.target.value))}
                      onBlur={e => handleCepBlur(e.target.value)}
                      placeholder="00000-000"
                    />
                    {loadingCep && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-primary" />}
                  </div>
                </Field>
                <Field label="Rua / Logradouro" required className="md:col-span-2">
                  <Input value={formData.rua} onChange={e => update('rua', e.target.value)} />
                </Field>
                <Field label="Número" required>
                  <Input value={formData.numero} onChange={e => update('numero', e.target.value)} />
                </Field>
                <Field label="Complemento" className="md:col-span-2">
                  <Input value={formData.complemento || ''} onChange={e => update('complemento', e.target.value)} placeholder="Apto, Bloco..." />
                </Field>
                <Field label="Bairro" required>
                  <Input value={formData.bairro} onChange={e => update('bairro', e.target.value)} />
                </Field>
                <Field label="Cidade" required>
                  <Input value={formData.cidade} onChange={e => update('cidade', e.target.value)} />
                </Field>
                <Field label="UF">
                  <Input value={formData.estado} onChange={e => update('estado', e.target.value)} maxLength={2} placeholder="MG" className="uppercase" />
                </Field>
              </div>
            </FormSection>
          </div>
        )}

        {/* ── STEP 4: Pagamento ── */}
        {step === 4 && (
          <div>
            <SectionHeader icon={CreditCard} title="Forma de Pagamento" subtitle="Como você prefere pagar a viagem?" />

            {/* Opções visuais */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { value: 'PIX', label: 'PIX', icon: '⚡' },
                { value: 'À Vista', label: 'À Vista', icon: '💵' },
                { value: 'Parcelado', label: 'Parcelado', icon: '📅' },
                { value: 'Cartão de Crédito', label: 'Cartão Crédito', icon: '💳' },
                { value: 'Transferência', label: 'Transferência', icon: '🏦' },
                { value: 'Dinheiro', label: 'Dinheiro', icon: '💰' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('forma_pagamento', opt.value)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${
                    formData.forma_pagamento === opt.value
                      ? 'border-primary bg-primary/10 shadow-glow-primary'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="text-2xl mb-1">{opt.icon}</div>
                  <div className={`text-sm font-semibold ${formData.forma_pagamento === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</div>
                </button>
              ))}
            </div>

            {formData.forma_pagamento === 'Parcelado' && (
              <FormSection className="mb-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Número de Parcelas" required>
                    <Select value={formData.numero_parcelas.toString()} onValueChange={v => update('numero_parcelas', parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2,3,4,5,6,7,8,9,10,11,12].map(n => <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Dia de Vencimento">
                    <Select value={formData.dia_vencimento.toString()} onValueChange={v => update('dia_vencimento', parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,5,10,15,20,25,28].map(d => <SelectItem key={d} value={d.toString()}>Todo dia {d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FormSection>
            )}

            {viagemSelecionada && (
              <FormSection>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-accent" />
                  <h4 className="font-display font-bold text-foreground">Valores da Viagem</h4>
                </div>
                <div className="space-y-2">
                  {[
                    { label: '1º Lote', value: viagemSelecionada.valor_1 },
                    { label: '2º Lote', value: viagemSelecionada.valor_2 },
                    { label: '3º Lote', value: viagemSelecionada.valor_3 },
                  ].filter(l => l.value > 0).map(l => (
                    <div key={l.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{l.label}</span>
                      <span className="font-bold text-foreground">R$ {Number(l.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">* Valores finais confirmados pela equipe Fly Turismo</p>
              </FormSection>
            )}
          </div>
        )}

        {/* ── STEP 5: Passageiros ── */}
        {step === 5 && (
          <div>
            <SectionHeader icon={Users} title="Passageiros do Grupo" subtitle="Você já está incluído. Adicione acompanhantes (opcional)" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 bg-primary/10 text-primary text-sm px-3 py-1.5 rounded-full">
                <User className="w-4 h-4" />
                <span className="font-medium">{formData.nome_completo} (você)</span>
              </div>
              <Button type="button" onClick={adicionarPassageiro} size="sm" className="gradient-primary text-white shadow-glow-primary gap-1.5">
                <Plus className="w-4 h-4" /> Adicionar
              </Button>
            </div>

            {passageiros.length === 0 ? (
              <FormSection className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-semibold text-foreground mb-1">Nenhum acompanhante</p>
                <p className="text-sm text-muted-foreground">Clique em "Adicionar" para incluir mais pessoas no grupo</p>
              </FormSection>
            ) : (
              <div className="space-y-4">
                {passageiros.map((p, i) => (
                  <FormSection key={i}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-glow-primary">{i + 2}</div>
                        <span className="font-display font-bold text-foreground">Acompanhante {i + 1}</span>
                      </div>
                      <button type="button" onClick={() => removerPassageiro(i)} className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="Nome Completo" className="md:col-span-2">
                        <Input value={p.nome_completo} onChange={e => updatePassageiro(i, 'nome_completo', e.target.value)} />
                      </Field>
                      <Field label="CPF">
                        <Input value={p.cpf} onChange={e => updatePassageiro(i, 'cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" />
                      </Field>
                      <Field label="Telefone">
                        <Input value={p.telefone} onChange={e => updatePassageiro(i, 'telefone', formatPhone(e.target.value))} placeholder="(38) 99999-9999" />
                      </Field>
                      <Field label="Data de Nascimento">
                        <Input type="date" value={p.data_nascimento} onChange={e => updatePassageiro(i, 'data_nascimento', e.target.value)} />
                      </Field>
                      <Field label="Sexo">
                        <Select value={p.sexo} onValueChange={v => updatePassageiro(i, 'sexo', v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </FormSection>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 6: Resumo ── */}
        {step === 6 && (
          <div>
            <SectionHeader icon={CheckCircle} title="Confirme sua Inscrição" subtitle="Revise os dados antes de enviar" />
            <div className="space-y-4">

              {/* Viagem */}
              <FormSection>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center"><Plane className="w-3.5 h-3.5 text-white" /></div>
                  <h3 className="font-display font-bold text-foreground">Viagem</h3>
                </div>
                <p className="font-bold text-lg text-foreground">{viagemSelecionada?.nome}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{viagemSelecionada?.destino}</span>
                  {viagemSelecionada?.data_saida && (
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(viagemSelecionada.data_saida + 'T12:00:00'), "dd/MM/yyyy")}</span>
                  )}
                </div>
              </FormSection>

              {/* Pessoais */}
              <FormSection>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><User className="w-3.5 h-3.5 text-muted-foreground" /></div>
                  <h3 className="font-display font-bold text-foreground">Dados Pessoais</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                  {[
                    ['Nome', formData.nome_completo], ['CPF', formData.cpf], ['RG', formData.rg],
                    ['Sexo', formData.sexo], ['Nascimento', formData.data_nascimento],
                    ['WhatsApp', formData.telefone], ['E-mail', formData.email],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-muted-foreground w-24 flex-shrink-0">{k}:</span>
                      <span className="font-medium text-foreground">{v}</span>
                    </div>
                  ))}
                  {formData.possui_crianca_colo && (
                    <div className="sm:col-span-2 bg-primary/5 text-primary text-xs px-3 py-2 rounded-lg mt-1">
                      🍼 Criança de colo: {formData.nome_crianca_colo || 'a informar'}, {formData.idade_crianca_colo} meses
                    </div>
                  )}
                </div>
              </FormSection>

              {/* Endereço */}
              <FormSection>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><Home className="w-3.5 h-3.5 text-muted-foreground" /></div>
                  <h3 className="font-display font-bold text-foreground">Endereço</h3>
                </div>
                <p className="text-sm font-medium text-foreground">{formData.rua}, {formData.numero}{formData.complemento ? ` – ${formData.complemento}` : ''}</p>
                <p className="text-sm text-muted-foreground">{formData.bairro} · {formData.cidade}{formData.estado ? `/${formData.estado}` : ''}{formData.cep ? ` · CEP ${formData.cep}` : ''}</p>
              </FormSection>

              {/* Pagamento */}
              <FormSection>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><CreditCard className="w-3.5 h-3.5 text-muted-foreground" /></div>
                  <h3 className="font-display font-bold text-foreground">Pagamento</h3>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="bg-muted px-3 py-1 rounded-full font-medium">{formData.forma_pagamento}</span>
                  {formData.forma_pagamento === 'Parcelado' && (
                    <><span className="bg-muted px-3 py-1 rounded-full">{formData.numero_parcelas}x</span>
                    <span className="bg-muted px-3 py-1 rounded-full">Vence dia {formData.dia_vencimento}</span></>
                  )}
                </div>
              </FormSection>

              {/* Passageiros */}
              {passageiros.length > 0 && (
                <FormSection>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><Users className="w-3.5 h-3.5 text-muted-foreground" /></div>
                    <h3 className="font-display font-bold text-foreground">Acompanhantes ({passageiros.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {passageiros.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm bg-muted/40 rounded-xl px-3 py-2">
                        <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center text-white text-[10px] font-bold">{i + 2}</div>
                        <span className="font-medium text-foreground">{p.nome_completo}</span>
                        {p.cpf && <span className="text-muted-foreground text-xs">CPF: {p.cpf}</span>}
                      </div>
                    ))}
                  </div>
                </FormSection>
              )}

              {/* Aviso */}
              <div className="flex gap-3 bg-accent/10 border border-accent/20 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground mb-1">Próximos passos</p>
                  <p className="text-sm text-muted-foreground">Após o envio, nossa equipe entrará em contato pelo WhatsApp para confirmar os detalhes e formas de pagamento.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed Bottom Navigation ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="gap-2 min-w-[100px]"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>

          <div className="text-xs text-muted-foreground text-center hidden sm:block">
            Etapa {step} de {STEPS.length}
          </div>

          {step < 6 ? (
            <Button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="gradient-primary text-white shadow-glow-primary gap-2 min-w-[120px]"
            >
              Continuar <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg min-w-[160px] text-sm font-semibold"
            >
              {submitMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Confirmar Inscrição</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
