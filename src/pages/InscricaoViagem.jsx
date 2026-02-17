import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plane, MapPin, Calendar, Users, Plus, Minus, CheckCircle,
  Loader2, XCircle, ChevronRight, ChevronLeft, User, Home,
  CreditCard, Baby, Phone, Mail, FileText, Star, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import logoFly from '@/assets/logo-fly-turismo.jpg';

const SUPABASE_URL = "https://duzfdwkjqqsayisfllww.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1emZkd2tqcXFzYXlpc2ZsbHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzI4ODksImV4cCI6MjA4NjQwODg4OX0.DKdBuaeaPunvxh_gawqaDHva3nOI0Qcbvby6zMV_8PA";

const STEPS = [
  { id: 1, title: 'Escolha a Viagem', icon: Plane },
  { id: 2, title: 'Dados Pessoais', icon: User },
  { id: 3, title: 'Endereço', icon: Home },
  { id: 4, title: 'Pagamento', icon: CreditCard },
  { id: 5, title: 'Passageiros', icon: Users },
  { id: 6, title: 'Confirmação', icon: CheckCircle },
];

const formatCPF = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
};

const formatCEP = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, '');
};

const buscarCEP = async (cep) => {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
};

export default function InscricaoViagem() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [loadingCep, setLoadingCep] = useState(false);
  const [passageiros, setPassageiros] = useState([]);
  const [formData, setFormData] = useState({
    id_viagem: '',
    nome_completo: '',
    rg: '',
    cpf: '',
    sexo: '',
    estado_civil: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    forma_pagamento: 'À Vista',
    numero_parcelas: 1,
    dia_vencimento: 10,
    possui_crianca_colo: false,
    nome_crianca_colo: '',
    idade_crianca_colo: 0,
    desconto: 0,
  });

  const { data: viagens = [], isLoading: loadingViagens } = useQuery({
    queryKey: ['viagens-publicas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viagens')
        .select('*')
        .eq('status', 'Aberta')
        .order('data_saida', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      // 1. Salvar formulário no banco
      const { data: formulario, error } = await supabase
        .from('formularios_contrato')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // 2. Enviar e-mail de confirmação ao cliente
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({
            to: payload.email,
            subject: '✈️ Fly Turismo – Formulário recebido com sucesso!',
            body: `Olá, ${payload.nome_completo}!\n\nRecebemos seu formulário de inscrição para a viagem. Nossa equipe entrará em contato em breve para confirmar os detalhes e formas de pagamento.\n\nQualquer dúvida, entre em contato:\n📞 (38) 9755-2155\n📧 flyturismo77@gmail.com\n\nEquipe Fly Turismo ✈️`,
          }),
        });
      } catch (_) { /* silencioso */ }

      // 3. Notificar admin
      try {
        const viagemSel = viagens.find(v => v.id === payload.id_viagem);
        await fetch(`${SUPABASE_URL}/functions/v1/notificar-inscricao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({
            nome_cliente: payload.nome_completo,
            telefone: payload.telefone,
            email: payload.email,
            viagem_nome: viagemSel?.nome || 'N/A',
            viagem_destino: viagemSel?.destino || 'N/A',
            forma_pagamento: payload.forma_pagamento,
            numero_parcelas: payload.numero_parcelas,
            total_passageiros: (payload.passageiros?.length || 0) + 1,
          }),
        });
      } catch (_) { /* silencioso */ }

      return formulario;
    },
    onSuccess: () => {
      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: () => {
      setStatus('error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const viagemSelecionada = viagens.find(v => v.id === formData.id_viagem);

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleCepBlur = async (cep) => {
    setLoadingCep(true);
    const addr = await buscarCEP(cep);
    if (addr) {
      setFormData(prev => ({
        ...prev,
        rua: addr.logradouro || prev.rua,
        bairro: addr.bairro || prev.bairro,
        cidade: addr.localidade || prev.cidade,
        estado: addr.uf || prev.estado,
      }));
    }
    setLoadingCep(false);
  };

  const adicionarPassageiro = () => {
    setPassageiros(prev => [...prev, { nome_completo: '', cpf: '', telefone: '', data_nascimento: '', sexo: '' }]);
  };

  const removerPassageiro = (i) => {
    setPassageiros(prev => prev.filter((_, idx) => idx !== i));
  };

  const updatePassageiro = (i, field, value) => {
    setPassageiros(prev => {
      const novo = [...prev];
      novo[i] = { ...novo[i], [field]: value };
      return novo;
    });
  };

  const canProceed = () => {
    if (step === 1) return !!formData.id_viagem;
    if (step === 2) return !!(formData.nome_completo && formData.cpf && formData.rg && formData.sexo && formData.data_nascimento && formData.telefone && formData.email);
    if (step === 3) return !!(formData.rua && formData.numero && formData.bairro && formData.cidade);
    if (step === 4) return !!(formData.forma_pagamento);
    return true;
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      passageiros: passageiros.filter(p => p.nome_completo),
      status: 'Pendente',
    };
    submitMutation.mutate(payload);
  };

  // ─── SUCCESS ───────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
        <Navbar />
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Inscrição enviada!</h1>
            <p className="text-lg text-gray-600 mb-2">Obrigado, <strong>{formData.nome_completo}</strong>!</p>
            <p className="text-gray-600 mb-6">
              Recebemos seu formulário para a viagem <strong>{viagemSelecionada?.nome}</strong>.
              Nossa equipe entrará em contato em breve pelo WhatsApp ou e-mail informado.
            </p>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-left space-y-3">
              <h3 className="font-bold text-gray-900 mb-4">📋 Resumo da sua inscrição</h3>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Viagem</span><span className="font-medium">{viagemSelecionada?.nome}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Destino</span><span className="font-medium">{viagemSelecionada?.destino}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Passageiros</span><span className="font-medium">{passageiros.length + 1}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Pagamento</span><span className="font-medium">{formData.forma_pagamento}{formData.forma_pagamento === 'Parcelado' ? ` em ${formData.numero_parcelas}x` : ''}</span></div>
              <Separator />
              <p className="text-xs text-gray-500 text-center">Um e-mail de confirmação foi enviado para <strong>{formData.email}</strong></p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={createPageUrl('Home')}>
                <Button variant="outline">Voltar ao site</Button>
              </Link>
              <Link to={createPageUrl('ViagensPublico')}>
                <Button className="bg-gradient-to-r from-sky-500 to-blue-600">Ver mais viagens</Button>
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // ─── ERROR ────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
        <Navbar />
        <section className="py-16 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Algo deu errado</h2>
            <p className="text-gray-600 mb-6">Não conseguimos enviar seu formulário. Por favor tente novamente ou entre em contato: <strong>(38) 9755-2155</strong></p>
            <Button onClick={() => setStatus('idle')} className="bg-sky-600 hover:bg-sky-700">Tentar Novamente</Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // ─── MAIN FORM ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={logoFly} alt="Fly Turismo" className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white/30" />
            <h1 className="text-3xl md:text-4xl font-bold">Inscrição para Viagem</h1>
          </div>
          <p className="text-sky-100 text-lg">Preencha o formulário abaixo para garantir sua vaga</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between overflow-x-auto gap-1">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className={`flex flex-col items-center gap-1 min-w-[60px] cursor-pointer transition-all ${isActive ? 'opacity-100' : isDone ? 'opacity-70' : 'opacity-40'}`}
                    onClick={() => isDone && setStep(s.id)}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-sky-600 text-white shadow-lg scale-110' : isDone ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight hidden sm:block ${isActive ? 'text-sky-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                      {s.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 transition-all ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── STEP 1: Escolha a Viagem ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Plane className="w-6 h-6 text-sky-600" /> Escolha a Viagem
            </h2>
            {loadingViagens ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              </div>
            ) : viagens.length === 0 ? (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center text-gray-500">
                  <Plane className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Nenhuma viagem disponível no momento</p>
                  <p className="text-sm mt-2">Aguarde novas viagens serem abertas ou entre em contato conosco.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {viagens.map(viagem => {
                  const selected = formData.id_viagem === viagem.id;
                  const vagas = (viagem.vagas_totais || 0) - (viagem.vagas_ocupadas || 0);
                  return (
                    <button
                      key={viagem.id}
                      type="button"
                      onClick={() => update('id_viagem', viagem.id)}
                      className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 shadow-sm hover:shadow-lg ${selected ? 'border-sky-500 ring-2 ring-sky-200 bg-white' : 'border-gray-200 bg-white hover:border-sky-300'}`}
                    >
                      <div className="flex flex-col md:flex-row">
                        {viagem.imagem_url && (
                          <div className="w-full md:w-48 h-36 md:h-auto flex-shrink-0">
                            <img src={viagem.imagem_url} alt={viagem.nome} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5 flex-1">
                          <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{viagem.nome}</h3>
                            {selected && <Badge className="bg-sky-100 text-sky-700">✓ Selecionada</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-sky-500" />{viagem.destino}</span>
                            {viagem.data_saida && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-sky-500" />
                                {format(new Date(viagem.data_saida + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                                {viagem.data_retorno && ` → ${format(new Date(viagem.data_retorno + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}`}
                              </span>
                            )}
                            <span className="flex items-center gap-1"><Users className="w-4 h-4 text-sky-500" />{vagas} vagas disponíveis</span>
                          </div>
                          <div className="flex flex-wrap gap-3 items-center">
                            {viagem.valor_1 > 0 && <span className="text-2xl font-bold text-sky-600">R$ {Number(viagem.valor_1).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                            {viagem.valor_2 > 0 && <span className="text-sm text-gray-500">Valor 2: R$ {Number(viagem.valor_2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                            {viagem.valor_3 > 0 && <span className="text-sm text-gray-500">Valor 3: R$ {Number(viagem.valor_3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-sky-600" /> Dados Pessoais
            </h2>
            <Card className="border-none shadow-lg">
              <CardContent className="p-6 grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label>Nome Completo *</Label>
                  <Input value={formData.nome_completo} onChange={e => update('nome_completo', e.target.value)} placeholder="Como no RG" required />
                </div>
                <div className="space-y-1.5">
                  <Label>RG *</Label>
                  <Input value={formData.rg} onChange={e => update('rg', e.target.value)} placeholder="0000000" required />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF *</Label>
                  <Input value={formData.cpf} onChange={e => update('cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Sexo *</Label>
                  <Select value={formData.sexo} onValueChange={v => update('sexo', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Estado Civil</Label>
                  <Select value={formData.estado_civil} onValueChange={v => update('estado_civil', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                      <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                      <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                      <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                      <SelectItem value="União Estável">União Estável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Nascimento *</Label>
                  <Input type="date" value={formData.data_nascimento} onChange={e => update('data_nascimento', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone / WhatsApp *</Label>
                  <Input value={formData.telefone} onChange={e => update('telefone', formatPhone(e.target.value))} placeholder="(38) 99999-9999" required />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input type="email" value={formData.email} onChange={e => update('email', e.target.value)} placeholder="seuemail@exemplo.com" required />
                </div>

                {/* Criança de Colo */}
                <div className="md:col-span-2 mt-2">
                  <Separator className="mb-4" />
                  <div className="flex items-center gap-3 mb-3">
                    <Baby className="w-5 h-5 text-sky-500" />
                    <h4 className="font-semibold text-gray-800">Criança de Colo</h4>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-sky-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.possui_crianca_colo}
                      onChange={e => update('possui_crianca_colo', e.target.checked)}
                      className="w-4 h-4 accent-sky-600"
                    />
                    <span className="text-gray-700">Vou levar uma criança de colo (até 2 anos)</span>
                  </label>
                  {formData.possui_crianca_colo && (
                    <div className="grid md:grid-cols-2 gap-4 mt-3 pl-3 border-l-2 border-sky-200">
                      <div className="space-y-1.5">
                        <Label>Nome da Criança</Label>
                        <Input value={formData.nome_crianca_colo} onChange={e => update('nome_crianca_colo', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Idade (meses ou anos)</Label>
                        <Input type="number" min={0} max={24} value={formData.idade_crianca_colo} onChange={e => update('idade_crianca_colo', parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 3: Endereço ── */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Home className="w-6 h-6 text-sky-600" /> Endereço
            </h2>
            <Card className="border-none shadow-lg">
              <CardContent className="p-6 grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>CEP</Label>
                  <div className="relative">
                    <Input
                      value={formData.cep}
                      onChange={e => update('cep', formatCEP(e.target.value))}
                      onBlur={e => handleCepBlur(e.target.value)}
                      placeholder="00000-000"
                    />
                    {loadingCep && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-sky-500" />}
                  </div>
                  <p className="text-xs text-gray-400">Digite o CEP para preencher automaticamente</p>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label>Rua / Logradouro *</Label>
                  <Input value={formData.rua} onChange={e => update('rua', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Número *</Label>
                  <Input value={formData.numero} onChange={e => update('numero', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Complemento</Label>
                  <Input value={formData.complemento || ''} onChange={e => update('complemento', e.target.value)} placeholder="Apto, Casa..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Bairro *</Label>
                  <Input value={formData.bairro} onChange={e => update('bairro', e.target.value)} required />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label>Cidade *</Label>
                  <Input value={formData.cidade} onChange={e => update('cidade', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado (UF)</Label>
                  <Input value={formData.estado} onChange={e => update('estado', e.target.value)} maxLength={2} placeholder="MG" className="uppercase" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 4: Pagamento ── */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-sky-600" /> Forma de Pagamento
            </h2>
            <Card className="border-none shadow-lg">
              <CardContent className="p-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Forma de Pagamento *</Label>
                    <Select value={formData.forma_pagamento} onValueChange={v => update('forma_pagamento', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="À Vista">À Vista</SelectItem>
                        <SelectItem value="Parcelado">Parcelado</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.forma_pagamento === 'Parcelado' && (
                    <>
                      <div className="space-y-1.5">
                        <Label>Número de Parcelas *</Label>
                        <Select value={formData.numero_parcelas.toString()} onValueChange={v => update('numero_parcelas', parseInt(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[2,3,4,5,6,7,8,9,10,11,12].map(n => (
                              <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Dia de Vencimento</Label>
                        <Select value={formData.dia_vencimento.toString()} onValueChange={v => update('dia_vencimento', parseInt(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[1,5,10,15,20,25,28].map(d => (
                              <SelectItem key={d} value={d.toString()}>Dia {d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>

                {viagemSelecionada && (
                  <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                    <h4 className="font-semibold text-sky-900 mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4" /> Valores da viagem
                    </h4>
                    <div className="space-y-1.5 text-sm">
                      {viagemSelecionada.valor_1 > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor 1</span>
                          <span className="font-bold text-sky-700">R$ {Number(viagemSelecionada.valor_1).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {viagemSelecionada.valor_2 > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor 2</span>
                          <span className="font-medium">R$ {Number(viagemSelecionada.valor_2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {viagemSelecionada.valor_3 > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor 3</span>
                          <span className="font-medium">R$ {Number(viagemSelecionada.valor_3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-sky-600 mt-3">* Os valores finais serão confirmados pela equipe da Fly Turismo.</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Desconto (R$) — se aplicável</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.desconto}
                    onChange={e => update('desconto', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 5: Passageiros Adicionais ── */}
        {step === 5 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-sky-600" /> Passageiros Adicionais
              </h2>
              <Button type="button" onClick={adicionarPassageiro} variant="outline" className="border-sky-300 text-sky-700 hover:bg-sky-50">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>
            <p className="text-gray-500 mb-4">Você já está inscrito como passageiro principal. Adicione aqui as demais pessoas do grupo (opcional).</p>
            {passageiros.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200 shadow-none">
                <CardContent className="p-8 text-center text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum passageiro adicional</p>
                  <p className="text-sm">Clique em "Adicionar" para incluir mais pessoas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {passageiros.map((p, i) => (
                  <Card key={i} className="border-none shadow-lg">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 text-sm font-bold flex items-center justify-center">{i + 2}</div>
                          Passageiro {i + 2}
                        </h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removerPassageiro(i)} className="text-red-500 hover:bg-red-50">
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="md:col-span-2 space-y-1.5">
                          <Label>Nome Completo</Label>
                          <Input value={p.nome_completo} onChange={e => updatePassageiro(i, 'nome_completo', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>CPF</Label>
                          <Input value={p.cpf} onChange={e => updatePassageiro(i, 'cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Telefone</Label>
                          <Input value={p.telefone} onChange={e => updatePassageiro(i, 'telefone', formatPhone(e.target.value))} placeholder="(38) 99999-9999" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Data de Nascimento</Label>
                          <Input type="date" value={p.data_nascimento} onChange={e => updatePassageiro(i, 'data_nascimento', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Sexo</Label>
                          <Select value={p.sexo} onValueChange={v => updatePassageiro(i, 'sexo', v)}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 6: Confirmação ── */}
        {step === 6 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-sky-600" /> Confirme seus Dados
            </h2>
            <div className="space-y-4">
              {/* Viagem */}
              <Card className="border-none shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-5 py-3">
                  <h3 className="text-white font-bold flex items-center gap-2"><Plane className="w-4 h-4" /> Viagem Selecionada</h3>
                </div>
                <CardContent className="p-5">
                  <p className="text-xl font-bold text-gray-900">{viagemSelecionada?.nome}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-sky-500" />{viagemSelecionada?.destino}</span>
                    {viagemSelecionada?.data_saida && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-sky-500" />
                        {format(new Date(viagemSelecionada.data_saida + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dados pessoais */}
              <Card className="border-none shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><User className="w-4 h-4" /> Dados Pessoais</h3>
                </div>
                <CardContent className="p-5 grid md:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Nome:</span> <span className="font-medium">{formData.nome_completo}</span></div>
                  <div><span className="text-gray-500">CPF:</span> <span className="font-medium">{formData.cpf}</span></div>
                  <div><span className="text-gray-500">RG:</span> <span className="font-medium">{formData.rg}</span></div>
                  <div><span className="text-gray-500">Sexo:</span> <span className="font-medium">{formData.sexo}</span></div>
                  <div><span className="text-gray-500">Nascimento:</span> <span className="font-medium">{formData.data_nascimento}</span></div>
                  <div><span className="text-gray-500">Telefone:</span> <span className="font-medium">{formData.telefone}</span></div>
                  <div className="md:col-span-2"><span className="text-gray-500">E-mail:</span> <span className="font-medium">{formData.email}</span></div>
                  {formData.possui_crianca_colo && (
                    <div className="md:col-span-2 bg-blue-50 p-2 rounded-lg">
                      <span className="text-blue-700 font-medium">🍼 Criança de colo: {formData.nome_crianca_colo}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Endereço */}
              <Card className="border-none shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Home className="w-4 h-4" /> Endereço</h3>
                </div>
                <CardContent className="p-5 text-sm">
                  <p className="font-medium">{formData.rua}, {formData.numero} {formData.complemento && `- ${formData.complemento}`}</p>
                  <p className="text-gray-600">{formData.bairro} – {formData.cidade}{formData.estado && ` / ${formData.estado}`}</p>
                  {formData.cep && <p className="text-gray-500">CEP: {formData.cep}</p>}
                </CardContent>
              </Card>

              {/* Pagamento */}
              <Card className="border-none shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Pagamento</h3>
                </div>
                <CardContent className="p-5 text-sm grid grid-cols-2 gap-2">
                  <div><span className="text-gray-500">Forma:</span> <span className="font-medium">{formData.forma_pagamento}</span></div>
                  {formData.forma_pagamento === 'Parcelado' && (
                    <>
                      <div><span className="text-gray-500">Parcelas:</span> <span className="font-medium">{formData.numero_parcelas}x</span></div>
                      <div><span className="text-gray-500">Vencimento:</span> <span className="font-medium">Dia {formData.dia_vencimento}</span></div>
                    </>
                  )}
                  {formData.desconto > 0 && (
                    <div><span className="text-gray-500">Desconto:</span> <span className="font-medium text-green-600">R$ {formData.desconto.toFixed(2)}</span></div>
                  )}
                </CardContent>
              </Card>

              {/* Passageiros */}
              {passageiros.length > 0 && (
                <Card className="border-none shadow-lg overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users className="w-4 h-4" /> Passageiros Adicionais ({passageiros.length})</h3>
                  </div>
                  <CardContent className="p-5">
                    <div className="space-y-2">
                      {passageiros.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg p-3">
                          <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center">{i + 2}</div>
                          <div>
                            <p className="font-medium">{p.nome_completo}</p>
                            {p.cpf && <p className="text-gray-500">CPF: {p.cpf}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Aviso */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">⚠️ Importante</p>
                <p>Ao confirmar, seus dados serão enviados à equipe Fly Turismo. O pagamento e confirmação final serão combinados diretamente pelo WhatsApp ou e-mail.</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>

          {step < 6 ? (
            <Button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8"
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

      <Footer />
    </div>
  );
}
