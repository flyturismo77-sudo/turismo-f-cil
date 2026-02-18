import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus, DollarSign, TrendingUp, TrendingDown, Loader2, Eye, CheckCircle2,
  AlertTriangle, Clock, Search, Upload, Calendar as CalendarIcon, CreditCard
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

const FORMAS_PAGAMENTO = [
  'PIX', 'Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'Boleto', 'Transferência'
];

export default function Recebimentos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedViagem, setSelectedViagem] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("alertas");
  const [showLancamento, setShowLancamento] = useState(false);
  const [showMarcarPaga, setShowMarcarPaga] = useState(false);
  const [showGerarParcelas, setShowGerarParcelas] = useState(false);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [tipoLancamento, setTipoLancamento] = useState("avista"); // avista ou parcelado
  const [usarIntervalo, setUsarIntervalo] = useState(true);

  const [formAvista, setFormAvista] = useState({
    id_cliente: '', valor: 0, forma_pagamento: 'PIX',
    data_pagamento: '', observacoes: '', comprovante_url: ''
  });

  const [formParcelado, setFormParcelado] = useState({
    id_cliente: '', valor_total: 0, numero_parcelas: 2,
    data_primeira_parcela: new Date().toISOString().split('T')[0],
    intervalo_dias: 30, forma_pagamento: 'PIX'
  });

  const [formMarcarPaga, setFormMarcarPaga] = useState({
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'PIX', comprovante_url: '', observacoes: ''
  });

  // Queries
  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: async () => {
      const { data } = await supabase.from('viagens').select('*').order('created_at', { ascending: false });
      return data || [];
    }
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await supabase.from('clientes').select('*').order('nome_completo');
      return data || [];
    }
  });

  const { data: parcelas = [] } = useQuery({
    queryKey: ['parcelas'],
    queryFn: async () => {
      const { data } = await supabase.from('parcelas').select('*').order('data_vencimento');
      return data || [];
    }
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: async () => {
      const { data } = await supabase.from('pagamentos').select('*').order('data_pagamento', { ascending: false });
      return data || [];
    }
  });

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('recebimentos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parcelas' }, () => {
        queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagamentos' }, () => {
        queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Mutations
  const lancarAvistaMutation = useMutation({
    mutationFn: async (data) => {
      // Criar parcela única com status baseado no pagamento
      const isPago = !!data.data_pagamento;
      const { error: pe } = await supabase.from('parcelas').insert({
        id_cliente: data.id_cliente,
        id_viagem: clientes.find(c => c.id === data.id_cliente)?.id_viagem,
        numero_parcela: 1,
        total_parcelas: 1,
        valor_parcela: data.valor,
        data_vencimento: data.data_pagamento || new Date().toISOString().split('T')[0],
        status: isPago ? 'Paga' : 'Pendente',
        forma_pagamento: data.forma_pagamento,
        data_pagamento: isPago ? data.data_pagamento : null,
        comprovante_url: data.comprovante_url || null,
        observacoes: data.observacoes || null,
        intervalo_dias: 0
      });
      if (pe) throw pe;

      if (isPago) {
        const { error: pagErr } = await supabase.from('pagamentos').insert({
          id_cliente: data.id_cliente,
          valor: data.valor,
          data_pagamento: data.data_pagamento,
          forma_pagamento: data.forma_pagamento,
          numero_parcela: 1,
          comprovante_url: data.comprovante_url || null,
          observacoes: data.observacoes || 'Pagamento à vista'
        });
        if (pagErr) throw pagErr;

        // Update client
        const cliente = clientes.find(c => c.id === data.id_cliente);
        if (cliente) {
          const novoValorPago = (cliente.valor_pago || 0) + data.valor;
          await supabase.from('clientes').update({
            valor_pago: novoValorPago,
            status_pagamento: novoValorPago >= (cliente.valor_total_pacote || 0) ? 'Pago' : 'Parcial'
          }).eq('id', cliente.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowLancamento(false);
      toast({ title: "✅ Lançamento registrado com sucesso!" });
    },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  const gerarParcelasMutation = useMutation({
    mutationFn: async (data) => {
      const cliente = clientes.find(c => c.id === data.id_cliente);
      if (!cliente) throw new Error("Cliente não encontrado");
      const valorParcela = data.valor_total / data.numero_parcelas;
      const novasParcelas = [];

      for (let i = 0; i < data.numero_parcelas; i++) {
        const dataVenc = addDays(new Date(data.data_primeira_parcela), i * data.intervalo_dias);
        novasParcelas.push({
          id_cliente: cliente.id,
          id_viagem: cliente.id_viagem,
          numero_parcela: i + 1,
          total_parcelas: data.numero_parcelas,
          valor_parcela: valorParcela,
          data_vencimento: dataVenc.toISOString().split('T')[0],
          status: 'Pendente',
          forma_pagamento: data.forma_pagamento,
          intervalo_dias: data.intervalo_dias
        });
      }

      const { error } = await supabase.from('parcelas').insert(novasParcelas);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      setShowGerarParcelas(false);
      toast({ title: "✅ Parcelas geradas com sucesso!" });
    },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  const marcarPagaMutation = useMutation({
    mutationFn: async ({ parcela, dados }) => {
      await supabase.from('parcelas').update({
        status: 'Paga',
        data_pagamento: dados.data_pagamento,
        forma_pagamento: dados.forma_pagamento,
        comprovante_url: dados.comprovante_url || null,
        observacoes: dados.observacoes || null
      }).eq('id', parcela.id);

      await supabase.from('pagamentos').insert({
        id_cliente: parcela.id_cliente,
        valor: parcela.valor_parcela,
        data_pagamento: dados.data_pagamento,
        forma_pagamento: dados.forma_pagamento,
        numero_parcela: parcela.numero_parcela,
        comprovante_url: dados.comprovante_url || null,
        observacoes: dados.observacoes || `Parcela ${parcela.numero_parcela}/${parcela.total_parcelas}`
      });

      const cliente = clientes.find(c => c.id === parcela.id_cliente);
      if (cliente) {
        const novoValorPago = (cliente.valor_pago || 0) + (parcela.valor_parcela || 0);
        await supabase.from('clientes').update({
          valor_pago: novoValorPago,
          status_pagamento: novoValorPago >= (cliente.valor_total_pacote || 0) ? 'Pago' : 'Parcial'
        }).eq('id', cliente.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowMarcarPaga(false);
      setSelectedParcela(null);
      toast({ title: "✅ Parcela marcada como paga!" });
    },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  // Helpers
  const getCliente = (id) => clientes.find(c => c.id === id);
  const getViagem = (id) => viagens.find(v => v.id === id);
  const hoje = new Date();

  const parcelasFiltradas = parcelas.filter(p => {
    if (selectedViagem !== "all" && p.id_viagem !== selectedViagem) return false;
    if (searchTerm) {
      const cliente = getCliente(p.id_cliente);
      const term = searchTerm.toLowerCase();
      if (!cliente?.nome_completo?.toLowerCase().includes(term) &&
          !cliente?.cpf?.includes(term)) return false;
    }
    return true;
  });

  const atrasadas = parcelasFiltradas.filter(p =>
    p.status !== 'Paga' && new Date(p.data_vencimento) < hoje
  );

  const proximasVencer = parcelasFiltradas.filter(p => {
    if (p.status === 'Paga') return false;
    const dias = differenceInDays(new Date(p.data_vencimento), hoje);
    return dias >= 0 && dias <= 3;
  });

  const pendentes = parcelasFiltradas.filter(p => p.status !== 'Paga');
  const pagas = parcelasFiltradas.filter(p => p.status === 'Paga');

  const totalRecebido = pagamentos.reduce((s, p) => s + (p.valor || 0), 0);
  const totalPendente = pendentes.reduce((s, p) => s + (p.valor_parcela || 0), 0);

  const handleMarcarPaga = (parcela) => {
    setSelectedParcela(parcela);
    setFormMarcarPaga({
      data_pagamento: new Date().toISOString().split('T')[0],
      forma_pagamento: parcela.forma_pagamento || 'PIX',
      comprovante_url: '', observacoes: ''
    });
    setShowMarcarPaga(true);
  };

  const clientesFiltrados = selectedViagem === "all" ? clientes : clientes.filter(c => c.id_viagem === selectedViagem);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">📥 Recebimentos</h1>
        <p className="text-muted-foreground mt-1">Controle de pagamentos e parcelas de clientes</p>
      </div>
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedViagem} onValueChange={setSelectedViagem}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todas as Viagens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Viagens</SelectItem>
              {viagens.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowGerarParcelas(true)} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
            <CalendarIcon className="w-4 h-4 mr-2" /> Gerar Parcelas
          </Button>
          <Button onClick={() => setShowLancamento(true)} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg">
            <Plus className="w-4 h-4 mr-2" /> Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Total Recebido</p>
                <h3 className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="w-10 h-10 bg-green-200 dark:bg-green-800 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-700 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">Pendente</p>
                <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-300 mt-1">R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="w-10 h-10 bg-orange-200 dark:bg-orange-800 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-700 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">Atrasadas</p>
                <h3 className="text-2xl font-bold text-red-900 dark:text-red-300 mt-1">{atrasadas.length}</h3>
              </div>
              <div className="w-10 h-10 bg-red-200 dark:bg-red-800 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Vencendo em 3 dias</p>
                <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-300 mt-1">{proximasVencer.length}</h3>
              </div>
              <div className="w-10 h-10 bg-amber-200 dark:bg-amber-800 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Buscar por nome ou CPF..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="alertas">🔔 Alertas ({atrasadas.length + proximasVencer.length})</TabsTrigger>
          <TabsTrigger value="pendentes">⏳ Pendentes ({pendentes.length})</TabsTrigger>
          <TabsTrigger value="pagas">✅ Pagas ({pagas.length})</TabsTrigger>
          <TabsTrigger value="historico">📋 Histórico</TabsTrigger>
        </TabsList>

        {/* Alertas Tab */}
        <TabsContent value="alertas" className="space-y-4">
          {atrasadas.length === 0 && proximasVencer.length === 0 ? (
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-900 dark:text-green-300">Tudo em dia!</h3>
                <p className="text-green-700 dark:text-green-400">Nenhuma parcela atrasada ou próxima do vencimento</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {atrasadas.length > 0 && (
                <Card className="border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-red-900 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Parcelas Atrasadas ({atrasadas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {atrasadas.map(p => {
                      const cliente = getCliente(p.id_cliente);
                      const diasAtrasados = Math.abs(differenceInDays(new Date(p.data_vencimento), hoje));
                      return (
                        <div key={p.id} className="bg-card rounded-lg p-3 border-l-4 border-red-500 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-foreground">{cliente?.nome_completo || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Parcela {p.numero_parcela}/{p.total_parcelas} • Venc: {format(new Date(p.data_vencimento), "dd/MM/yyyy")}</p>
                            <Badge variant="destructive" className="mt-1">{diasAtrasados} dia(s) atrasado</Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-700">R$ {(p.valor_parcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <Button size="sm" onClick={() => handleMarcarPaga(p)} className="mt-1 bg-green-600 hover:bg-green-700 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Pagar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
              {proximasVencer.length > 0 && (
                <Card className="border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-amber-900 dark:text-amber-400 flex items-center gap-2">
                      <Clock className="w-5 h-5" /> Vencendo em breve ({proximasVencer.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {proximasVencer.map(p => {
                      const cliente = getCliente(p.id_cliente);
                      const diasRestantes = differenceInDays(new Date(p.data_vencimento), hoje);
                      return (
                        <div key={p.id} className="bg-card rounded-lg p-3 border-l-4 border-amber-500 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-foreground">{cliente?.nome_completo || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Parcela {p.numero_parcela}/{p.total_parcelas} • Venc: {format(new Date(p.data_vencimento), "dd/MM/yyyy")}</p>
                            <Badge className="mt-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200">Faltam {diasRestantes} dia(s)</Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-amber-700">R$ {(p.valor_parcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <Button size="sm" onClick={() => handleMarcarPaga(p)} className="mt-1 bg-green-600 hover:bg-green-700 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Pagar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Pendentes Tab */}
        <TabsContent value="pendentes">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendentes.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma parcela pendente</TableCell></TableRow>
                  ) : pendentes.map(p => {
                    const cliente = getCliente(p.id_cliente);
                    const diasRestantes = differenceInDays(new Date(p.data_vencimento), hoje);
                    const isAtrasada = diasRestantes < 0;
                    return (
                      <TableRow key={p.id} className={isAtrasada ? 'bg-red-50 dark:bg-red-950/20' : diasRestantes <= 3 ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                        <TableCell className="font-medium">{cliente?.nome_completo || 'N/A'}</TableCell>
                        <TableCell>{p.numero_parcela}/{p.total_parcelas}</TableCell>
                        <TableCell className="font-bold">R$ {(p.valor_parcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{format(new Date(p.data_vencimento), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          {isAtrasada ? (
                            <Badge variant="destructive">{Math.abs(diasRestantes)}d atrasado</Badge>
                          ) : diasRestantes <= 3 ? (
                            <Badge className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200">{diasRestantes}d restante(s)</Badge>
                          ) : (
                            <span className="text-muted-foreground">{diasRestantes} dias</span>
                          )}
                        </TableCell>
                        <TableCell>{p.forma_pagamento}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleMarcarPaga(p)} className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Pagar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagas Tab */}
        <TabsContent value="pagas">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Comprovante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagas.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma parcela paga</TableCell></TableRow>
                  ) : pagas.map(p => {
                    const cliente = getCliente(p.id_cliente);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{cliente?.nome_completo || 'N/A'}</TableCell>
                        <TableCell>{p.numero_parcela}/{p.total_parcelas}</TableCell>
                        <TableCell className="font-bold text-green-600 dark:text-green-400">R$ {(p.valor_parcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{p.data_pagamento ? format(new Date(p.data_pagamento), "dd/MM/yyyy") : '-'}</TableCell>
                        <TableCell>{p.forma_pagamento}</TableCell>
                        <TableCell>
                          {p.comprovante_url ? (
                            <a href={p.comprovante_url} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Ver
                            </a>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico Tab */}
        <TabsContent value="historico">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentos.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum pagamento registrado</TableCell></TableRow>
                  ) : pagamentos.map(p => {
                    const cliente = getCliente(p.id_cliente);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{p.data_pagamento ? format(new Date(p.data_pagamento), "dd/MM/yyyy") : '-'}</TableCell>
                        <TableCell className="font-medium">{cliente?.nome_completo || 'N/A'}</TableCell>
                        <TableCell className="font-bold text-green-600 dark:text-green-400">R$ {(p.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{p.forma_pagamento}</TableCell>
                        <TableCell>{p.numero_parcela || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.observacoes || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Novo Lançamento */}
      <Dialog open={showLancamento} onOpenChange={setShowLancamento}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={tipoLancamento === 'avista' ? 'default' : 'outline'} onClick={() => setTipoLancamento('avista')} className="flex-1">À Vista</Button>
              <Button variant={tipoLancamento === 'parcelado' ? 'default' : 'outline'} onClick={() => { setTipoLancamento('parcelado'); setShowLancamento(false); setShowGerarParcelas(true); }} className="flex-1">Parcelado</Button>
            </div>

            {tipoLancamento === 'avista' && (
              <form onSubmit={e => { e.preventDefault(); lancarAvistaMutation.mutate(formAvista); }} className="space-y-4">
                <div>
                  <Label>Cliente *</Label>
                  <Select value={formAvista.id_cliente} onValueChange={v => setFormAvista({ ...formAvista, id_cliente: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {clientesFiltrados.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome_completo} {c.cpf ? `(${c.cpf})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Valor (R$) *</Label>
                    <Input type="number" step="0.01" value={formAvista.valor || ''} onChange={e => setFormAvista({ ...formAvista, valor: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Forma de Pagamento *</Label>
                    <Select value={formAvista.forma_pagamento} onValueChange={v => setFormAvista({ ...formAvista, forma_pagamento: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Data do Pagamento (deixe vazio se ainda não foi pago)</Label>
                  <Input type="date" value={formAvista.data_pagamento} onChange={e => setFormAvista({ ...formAvista, data_pagamento: e.target.value })} />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={formAvista.observacoes} onChange={e => setFormAvista({ ...formAvista, observacoes: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={!formAvista.id_cliente || formAvista.valor <= 0 || lancarAvistaMutation.isPending} className="bg-green-600 hover:bg-green-700">
                    {lancarAvistaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {formAvista.data_pagamento ? 'Registrar como Pago' : 'Registrar como Pendente'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Gerar Parcelas */}
      <Dialog open={showGerarParcelas} onOpenChange={setShowGerarParcelas}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerar Parcelas</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); gerarParcelasMutation.mutate(formParcelado); }} className="space-y-4">
            <div>
              <Label>Cliente *</Label>
              <Select value={formParcelado.id_cliente} onValueChange={v => setFormParcelado({ ...formParcelado, id_cliente: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {clientesFiltrados.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome_completo} {c.cpf ? `(${c.cpf})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor Total (R$) *</Label>
                <Input type="number" step="0.01" value={formParcelado.valor_total || ''} onChange={e => setFormParcelado({ ...formParcelado, valor_total: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Nº Parcelas *</Label>
                <Input type="number" min="2" max="24" value={formParcelado.numero_parcelas} onChange={e => setFormParcelado({ ...formParcelado, numero_parcelas: parseInt(e.target.value) || 2 })} />
              </div>
            </div>
            {formParcelado.valor_total > 0 && formParcelado.numero_parcelas > 0 && (
              <p className="text-sm text-sky-700 bg-sky-50 p-2 rounded">
                💡 Valor de cada parcela: <strong>R$ {(formParcelado.valor_total / formParcelado.numero_parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </p>
            )}
            <div>
              <Label>Data da 1ª Parcela *</Label>
              <Input type="date" value={formParcelado.data_primeira_parcela} onChange={e => setFormParcelado({ ...formParcelado, data_primeira_parcela: e.target.value })} />
            </div>
            <div>
              <Label>Intervalo entre parcelas (dias) *</Label>
              <Input type="number" min="1" max="90" value={formParcelado.intervalo_dias} onChange={e => setFormParcelado({ ...formParcelado, intervalo_dias: parseInt(e.target.value) || 30 })} />
              <p className="text-xs text-gray-500 mt-1">Ex: 30 = mensal, 15 = quinzenal, 7 = semanal</p>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={formParcelado.forma_pagamento} onValueChange={v => setFormParcelado({ ...formParcelado, forma_pagamento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!formParcelado.id_cliente || formParcelado.valor_total <= 0 || gerarParcelasMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                {gerarParcelasMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CalendarIcon className="w-4 h-4 mr-2" />}
                Gerar {formParcelado.numero_parcelas} Parcelas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Marcar como Paga */}
      <Dialog open={showMarcarPaga} onOpenChange={setShowMarcarPaga}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Parcela como Paga</DialogTitle>
          </DialogHeader>
          {selectedParcela && (
            <form onSubmit={e => { e.preventDefault(); marcarPagaMutation.mutate({ parcela: selectedParcela, dados: formMarcarPaga }); }} className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="font-semibold text-foreground">{getCliente(selectedParcela.id_cliente)?.nome_completo}</p>
                <p className="text-sm text-muted-foreground">Parcela {selectedParcela.numero_parcela}/{selectedParcela.total_parcelas}</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">R$ {(selectedParcela.valor_parcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <Label>Data do Pagamento *</Label>
                <Input type="date" value={formMarcarPaga.data_pagamento} onChange={e => setFormMarcarPaga({ ...formMarcarPaga, data_pagamento: e.target.value })} required />
              </div>
              <div>
                <Label>Forma de Pagamento *</Label>
                <Select value={formMarcarPaga.forma_pagamento} onValueChange={v => setFormMarcarPaga({ ...formMarcarPaga, forma_pagamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={formMarcarPaga.observacoes} onChange={e => setFormMarcarPaga({ ...formMarcarPaga, observacoes: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={marcarPagaMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {marcarPagaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Confirmar Pagamento
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
