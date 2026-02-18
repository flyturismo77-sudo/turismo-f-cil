import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileText, Users, CheckCircle, Copy, ExternalLink, Loader2,
  Search, Filter, Download, Eye, QrCode, MapPin, Phone, Mail,
  CreditCard, Baby, Calendar, User, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const statusColors = {
  "Pendente": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Recebido": "bg-blue-100 text-blue-700 border-blue-200",
  "Processado": "bg-green-100 text-green-700 border-green-200",
};

const LINK_FORMULARIO = `${window.location.origin}/InscricaoViagem`;

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function FormularioModal({ form, viagens, open, onClose }) {
  if (!form) return null;
  const viagem = viagens.find(v => v.id === form.id_viagem);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            {form.nome_completo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Status + Viagem */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={`${statusColors[form.status]} border text-xs px-3 py-1`}>{form.status}</Badge>
            {viagem && (
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {viagem.nome} — {viagem.destino}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {form.created_at && format(new Date(form.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>

          <Separator />

          {/* Dados Pessoais */}
          <Section title="Dados Pessoais" icon={<User className="w-4 h-4" />}>
            <Grid2>
              <Field label="CPF" value={form.cpf} />
              <Field label="RG" value={form.rg} />
              <Field label="Sexo" value={form.sexo} />
              <Field label="Estado Civil" value={form.estado_civil} />
              <Field label="Nascimento" value={form.data_nascimento ? format(new Date(form.data_nascimento + 'T12:00:00'), 'dd/MM/yyyy') : '—'} />
            </Grid2>
          </Section>

          <Separator />

          {/* Contato */}
          <Section title="Contato" icon={<Phone className="w-4 h-4" />}>
            <Grid2>
              <Field label="Telefone" value={form.telefone} />
              <Field label="E-mail" value={form.email} />
              <Field label="Endereço" value={[form.rua, form.numero, form.bairro, form.cidade].filter(Boolean).join(', ')} colSpan />
            </Grid2>
          </Section>

          <Separator />

          {/* Pagamento */}
          <Section title="Pagamento" icon={<CreditCard className="w-4 h-4" />}>
            <Grid2>
              <Field label="Forma" value={form.forma_pagamento} />
              {form.numero_parcelas > 1 && <Field label="Parcelas" value={`${form.numero_parcelas}x`} />}
              {form.dia_vencimento && <Field label="Dia Vencimento" value={`Dia ${form.dia_vencimento}`} />}
              {form.desconto > 0 && <Field label="Desconto" value={`R$ ${Number(form.desconto).toFixed(2)}`} />}
              {form.valor_total > 0 && <Field label="Valor Total" value={`R$ ${Number(form.valor_total).toFixed(2)}`} />}
            </Grid2>
          </Section>

          {/* Criança de Colo */}
          {form.possui_crianca_colo && (
            <>
              <Separator />
              <Section title="Criança de Colo" icon={<Baby className="w-4 h-4" />}>
                <Grid2>
                  <Field label="Nome" value={form.nome_crianca_colo} />
                  <Field label="Idade" value={`${form.idade_crianca_colo} anos`} />
                </Grid2>
              </Section>
            </>
          )}

          {/* Passageiros */}
          {form.passageiros && form.passageiros.length > 0 && (
            <>
              <Separator />
              <Section title={`Passageiros Adicionais (${form.passageiros.length})`} icon={<Users className="w-4 h-4" />}>
                <div className="grid gap-2">
                  {form.passageiros.map((p, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm flex-shrink-0">
                        {i + 2}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{p.nome_completo}</p>
                        <p className="text-xs text-muted-foreground">CPF: {p.cpf || '—'}{p.telefone ? ` · Tel: ${p.telefone}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <h4 className="font-semibold text-sm flex items-center gap-2 mb-3 text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </h4>
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-2">{children}</div>;
}

function Field({ label, value, colSpan }) {
  return (
    <div className={colSpan ? 'col-span-2' : ''}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Formularios() {
  const queryClient = useQueryClient();
  const qrRef = useRef(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterViagem, setFilterViagem] = useState('Todas');
  const [selectedForm, setSelectedForm] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const { data: formularios = [] } = useQuery({
    queryKey: ['formularios_contrato'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formularios_contrato')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: async () => {
      const { data, error } = await supabase.from('viagens').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('formularios_contrato')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['formularios_contrato']),
  });

  const processarMutation = useMutation({
    mutationFn: async (formulario) => {
      const viagem = viagens.find(v => v.id === formulario.id_viagem);
      const valorFinal = (formulario.valor_total || viagem?.valor_1 || 0) - (formulario.desconto || 0);

      // 1. Criar cliente
      const { data: cliente, error: clienteErr } = await supabase
        .from('clientes')
        .insert({
          nome_completo: formulario.nome_completo,
          cpf: formulario.cpf,
          sexo: formulario.sexo,
          data_nascimento: formulario.data_nascimento,
          telefone: formulario.telefone,
          email: formulario.email,
          rua: formulario.rua,
          numero: formulario.numero,
          bairro: formulario.bairro,
          cidade: formulario.cidade,
          id_viagem: formulario.id_viagem,
          forma_pagamento: formulario.numero_parcelas > 1 ? 'Parcelado' : 'À Vista',
          numero_parcelas: formulario.numero_parcelas || 1,
          possui_crianca_colo: formulario.possui_crianca_colo,
          nome_crianca_colo: formulario.nome_crianca_colo,
          idade_crianca_colo: formulario.idade_crianca_colo,
          status_pagamento: 'Pendente',
          valor_total_pacote: valorFinal,
          valor_pago: 0,
        })
        .select()
        .single();
      if (clienteErr) throw clienteErr;

      // 2. Gerar parcelas automaticamente
      const numParcelas = formulario.numero_parcelas || 1;
      if (numParcelas > 0) {
        const valorParcela = valorFinal / numParcelas;
        const diaVenc = formulario.dia_vencimento || 10;
        const hoje = new Date();
        const parcelas = Array.from({ length: numParcelas }, (_, i) => {
          const venc = new Date(hoje.getFullYear(), hoje.getMonth() + i + 1, diaVenc);
          return {
            id_cliente: cliente.id,
            id_viagem: formulario.id_viagem,
            numero_parcela: i + 1,
            total_parcelas: numParcelas,
            valor_parcela: Number(valorParcela.toFixed(2)),
            data_vencimento: venc.toISOString().split('T')[0],
            status: 'Pendente',
            forma_pagamento: formulario.forma_pagamento || 'PIX',
            intervalo_dias: 30,
          };
        });
        const { error: parcelasErr } = await supabase.from('parcelas').insert(parcelas);
        if (parcelasErr) throw parcelasErr;
      }

      // 3. Atualizar vagas da viagem
      if (viagem) {
        await supabase
          .from('viagens')
          .update({ vagas_ocupadas: (viagem.vagas_ocupadas || 0) + 1 })
          .eq('id', viagem.id);
      }

      // 4. Marcar formulário como processado
      const { error: formErr } = await supabase
        .from('formularios_contrato')
        .update({ status: 'Processado' })
        .eq('id', formulario.id);
      if (formErr) throw formErr;
    },
    onSuccess: (_, formulario) => {
      queryClient.invalidateQueries(['formularios_contrato']);
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['viagens']);
      queryClient.invalidateQueries(['parcelas']);
      toast.success('Formulário processado! Cliente e parcelas criados com sucesso.');

      // Enviar e-mail de confirmação para o cliente
      if (formulario.email) {
        const viagem = viagens.find(v => v.id === formulario.id_viagem);
        const valorFinal = (formulario.valor_total || viagem?.valor_1 || 0) - (formulario.desconto || 0);
        const numParcelas = formulario.numero_parcelas || 1;
        const emailBody = `Olá, ${formulario.nome_completo}!\n\nSua inscrição foi confirmada com sucesso. 🎉\n\n` +
          `📍 Viagem: ${viagem?.nome || '—'} — ${viagem?.destino || ''}\n` +
          `📅 Data de Saída: ${viagem?.data_saida ? new Date(viagem.data_saida + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}\n\n` +
          `💳 Forma de Pagamento: ${formulario.forma_pagamento}${numParcelas > 1 ? ` em ${numParcelas}x` : ''}\n` +
          `💰 Valor Total: R$ ${valorFinal.toFixed(2)}\n` +
          (numParcelas > 1 ? `📆 Vencimento das parcelas: Todo dia ${formulario.dia_vencimento || 10}\n` : '') +
          `\nEm breve entraremos em contato com mais detalhes.\n\nFly Turismo — Equipe de Atendimento`;

        supabase.functions.invoke('send-email', {
          body: {
            to: formulario.email,
            subject: `✅ Inscrição confirmada: ${viagem?.nome || 'Viagem'}`,
            body: emailBody,
          },
        }).catch(() => {}); // silently fail - email is bonus
      }
    },
    onError: (err) => toast.error('Erro ao processar: ' + err.message),
  });

  const handleProcessar = (form) => {
    if (form.status === 'Processado') {
      toast.info('Este formulário já foi processado!');
      return;
    }
    processarMutation.mutate(form);
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(LINK_FORMULARIO);
    toast.success('Link copiado!');
  };

  const baixarQR = useCallback(() => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement('a');
      a.download = 'qrcode-inscricao.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const getViagemNome = (id) => {
    const v = viagens.find(v => v.id === id);
    return v ? v.nome : '—';
  };

  // Filtering
  const filtered = formularios.filter(f => {
    const matchSearch = !search || f.nome_completo?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'Todos' || f.status === filterStatus;
    const matchViagem = filterViagem === 'Todas' || f.id_viagem === filterViagem;
    return matchSearch && matchStatus && matchViagem;
  });

  const countByStatus = (s) => formularios.filter(f => f.status === s).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Formulários de Contrato</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie inscrições recebidas dos clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowQR(v => !v)} className="gap-2">
            <QrCode className="w-4 h-4" />
            QR Code
          </Button>
          <Button size="sm" onClick={() => window.open(LINK_FORMULARIO, '_blank')} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Abrir Formulário
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pendentes', status: 'Pendente', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Recebidos', status: 'Recebido', color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Processados', status: 'Processado', color: 'bg-green-50 border-green-200 text-green-700' },
        ].map(({ label, status, color }) => (
          <div key={status} className={`rounded-xl border p-4 ${color} cursor-pointer transition-all hover:shadow-md`}
            onClick={() => setFilterStatus(filterStatus === status ? 'Todos' : status)}>
            <p className="text-2xl font-bold">{countByStatus(status)}</p>
            <p className="text-sm font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* QR Code Panel */}
      {showQR && (
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 p-4 bg-white rounded-2xl border-2 border-dashed border-border shadow-sm">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={LINK_FORMULARIO}
                  size={160}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-bold text-lg">QR Code do Formulário</h3>
                <p className="text-sm text-muted-foreground">
                  Imprima e cole em materiais de divulgação. Ao escanear, o cliente é direcionado direto para o formulário de inscrição.
                </p>
                <div className="flex items-center gap-2">
                  <Input value={LINK_FORMULARIO} readOnly className="text-xs" />
                  <Button variant="outline" size="sm" onClick={copiarLink}><Copy className="w-4 h-4" /></Button>
                </div>
                <Button onClick={baixarQR} variant="outline" className="gap-2 w-full md:w-auto">
                  <Download className="w-4 h-4" />
                  Baixar PNG
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Recebido">Recebido</SelectItem>
            <SelectItem value="Processado">Processado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterViagem} onValueChange={setFilterViagem}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todas as viagens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as viagens</SelectItem>
            {viagens.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || filterStatus !== 'Todos' || filterViagem !== 'Todas') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterStatus('Todos'); setFilterViagem('Todas'); }}>
            <X className="w-4 h-4 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Lista */}
      <div className="grid gap-3">
        {filtered.map((form) => (
          <FormularioCard
            key={form.id}
            form={form}
            viagemNome={getViagemNome(form.id_viagem)}
            onStatusChange={(id, s) => updateStatusMutation.mutate({ id, status: s })}
            onProcessar={handleProcessar}
            onView={() => setSelectedForm(form)}
            isProcessing={processarMutation.isPending}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhum formulário encontrado</p>
          <p className="text-sm mt-1">
            {formularios.length === 0 ? 'Compartilhe o link para receber inscrições' : 'Tente ajustar os filtros'}
          </p>
        </div>
      )}

      {/* Modal Detalhes */}
      <FormularioModal
        form={selectedForm}
        viagens={viagens}
        open={!!selectedForm}
        onClose={() => setSelectedForm(null)}
      />
    </div>
  );
}

// ─── Card Item ────────────────────────────────────────────────────────────────
function FormularioCard({ form, viagemNome, onStatusChange, onProcessar, onView, isProcessing }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
            {form.nome_completo?.charAt(0)?.toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground">{form.nome_completo}</p>
              <Badge className={`${statusColors[form.status]} border text-[11px] px-2 py-0`}>{form.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {viagemNome} · {form.telefone || '—'} · {form.forma_pagamento}
              {form.numero_parcelas > 1 ? ` ${form.numero_parcelas}x` : ''}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select
              value={form.status}
              onValueChange={(v) => onStatusChange(form.id, v)}
              disabled={form.status === 'Processado'}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Recebido">Recebido</SelectItem>
                <SelectItem value="Processado">Processado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView} title="Ver detalhes">
              <Eye className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(v => !v)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground text-xs">CPF</span><p className="font-medium">{form.cpf || '—'}</p></div>
              <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium truncate">{form.email || '—'}</p></div>
              <div><span className="text-muted-foreground text-xs">Valor Total</span><p className="font-medium">R$ {Number(form.valor_total || 0).toFixed(2)}</p></div>
              <div><span className="text-muted-foreground text-xs">Desconto</span><p className="font-medium text-green-600">R$ {Number(form.desconto || 0).toFixed(2)}</p></div>
            </div>

            {form.possui_crianca_colo && (
              <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 rounded-lg px-3 py-2">
                <Baby className="w-4 h-4" />
                Criança de colo: <strong>{form.nome_crianca_colo}</strong> ({form.idade_crianca_colo} anos)
              </div>
            )}

            {form.passageiros?.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                {form.passageiros.length} passageiro(s) adicional(is)
              </p>
            )}

            {form.status !== 'Processado' && (
              <Button
                onClick={() => onProcessar(form)}
                disabled={isProcessing}
                size="sm"
                className="gap-2 bg-green-600 hover:bg-green-700 text-white mt-1"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Processar e Criar Cliente + Parcelas
              </Button>
            )}

            {form.status === 'Processado' && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4" />
                Processado — cliente e parcelas criados no sistema
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
