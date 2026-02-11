import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, DollarSign, TrendingUp, TrendingDown, Loader2, Download, Eye, FileText, Edit, Calendar as CalendarIcon, CheckCircle2, User } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { startOfMonth, endOfMonth } from "date-fns";
import AlertasParcelas from "../components/financeiro/AlertasParcelas";
import HistoricoCliente from "../components/financeiro/HistoricoCliente";
import FinanceiroPorViagem from "../components/financeiro/FinanceiroPorViagem";

export default function Financeiro() {
  const [showForm, setShowForm] = useState(false);
  const [showParceladoForm, setShowParceladoForm] = useState(false);
  const [showMarcarPagaDialog, setShowMarcarPagaDialog] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState(null);
  const [uploadingComprovante, setUploadingComprovante] = useState(false);
  const [viewingComprovante, setViewingComprovante] = useState(null);
  const [selectedViagem, setSelectedViagem] = useState("all");
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [activeTab, setActiveTab] = useState("resumo");
  const [formData, setFormData] = useState({
    id_cliente: '',
    valor: 0,
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'PIX',
    numero_parcela: 1,
    comprovante_url: '',
    observacoes: ''
  });
  const [parceladoData, setParceladoData] = useState({
    id_cliente: '',
    valor_total: 0,
    numero_parcelas: 2,
    data_primeira_parcela: new Date().toISOString().split('T')[0],
    forma_pagamento: 'Cartão Crédito'
  });
  const [marcarPagaData, setMarcarPagaData] = useState({
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'PIX',
    comprovante_url: '',
    observacoes: ''
  });

  const queryClient = useQueryClient();

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: () => base44.entities.Viagem.list(),
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: () => base44.entities.Pagamento.list("-data_pagamento"),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
  });

  const { data: despesasEmpresa = [] } = useQuery({
    queryKey: ['despesas-empresa'],
    queryFn: () => base44.entities.PagamentoEmpresa.list(),
  });

  const { data: parcelas = [] } = useQuery({
    queryKey: ['parcelas'],
    queryFn: () => base44.entities.Parcela.list("-data_vencimento"),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const pagamento = await base44.entities.Pagamento.create(data);
      
      // Atualizar cliente
      const cliente = clientes.find(c => c.id === data.id_cliente);
      if (cliente) {
        const novoValorPago = (cliente.valor_pago || 0) + data.valor;
        const novoStatus = novoValorPago >= cliente.valor_total_pacote
          ? 'Pago'
          : novoValorPago > 0
          ? 'Parcial'
          : 'Pendente';

        await base44.entities.Cliente.update(cliente.id, {
          ...cliente,
          valor_pago: novoValorPago,
          status_pagamento: novoStatus
        });

        // Enviar recibo por email (funcionalidade futura)
        if (cliente.email) {
          try {
            const viagem = viagens.find(v => v.id === cliente.id_viagem);
            await base44.integrations.Core.SendEmail({
              to: cliente.email,
              subject: 'Recibo de pagamento – Fly Turismo',
              body: `Olá ${cliente.nome_completo},\n\nConfirmamos o recebimento do seu pagamento referente à viagem ${viagem?.nome || 'N/A'}.\n\nValor: R$ ${data.valor.toFixed(2)}\nData: ${format(new Date(data.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}\nForma de pagamento: ${data.forma_pagamento}\n\nObrigado por viajar com a Fly Turismo! ✈️\n\nEquipe Fly Turismo`
            });
          } catch (emailErr) {
            console.warn('Email não enviado:', emailErr);
          }
        }
      }
      
      return pagamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pagamentos']);
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['parcelas']);
      setShowForm(false);
      setEditingPagamento(null);
      resetForm();
    },
  });

  const createParceladoMutation = useMutation({
    mutationFn: async (data) => {
      const cliente = clientes.find(c => c.id === data.id_cliente);
      if (!cliente) throw new Error("Cliente não encontrado");
      
      const valorParcela = data.valor_total / data.numero_parcelas;
      const parcelas = [];
      
      // Gerar parcelas
      for (let i = 0; i < data.numero_parcelas; i++) {
        const dataVencimento = addMonths(new Date(data.data_primeira_parcela), i);
        
        parcelas.push({
          id_cliente: cliente.id,
          id_viagem: cliente.id_viagem,
          numero_parcela: i + 1,
          total_parcelas: data.numero_parcelas,
          valor_parcela: valorParcela,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          status: 'Pendente',
          forma_pagamento: data.forma_pagamento
        });
      }
      
      // Criar todas as parcelas
      await Promise.all(parcelas.map(p => base44.entities.Parcela.create(p)));
      
      return parcelas;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parcelas']);
      queryClient.invalidateQueries(['clientes']);
      setShowParceladoForm(false);
      resetParceladoForm();
      alert('✅ Parcelas geradas com sucesso!');
    },
  });

  const marcarPagaMutation = useMutation({
    mutationFn: async ({ parcela, dados }) => {
      // Atualizar parcela
      await base44.entities.Parcela.update(parcela.id, {
        ...parcela,
        status: 'Paga',
        data_pagamento: dados.data_pagamento,
        forma_pagamento: dados.forma_pagamento || parcela.forma_pagamento,
        comprovante_url: dados.comprovante_url,
        observacoes: dados.observacoes
      });
      
      // Registrar pagamento
      await base44.entities.Pagamento.create({
        id_cliente: parcela.id_cliente,
        valor: parcela.valor_parcela,
        data_pagamento: dados.data_pagamento,
        forma_pagamento: dados.forma_pagamento || parcela.forma_pagamento,
        numero_parcela: parcela.numero_parcela,
        comprovante_url: dados.comprovante_url,
        observacoes: dados.observacoes || `Parcela ${parcela.numero_parcela}/${parcela.total_parcelas}`
      });
      
      // Atualizar cliente
      const cliente = clientes.find(c => c.id === parcela.id_cliente);
      if (cliente) {
        const novoValorPago = (cliente.valor_pago || 0) + parcela.valor_parcela;
        const novoStatus = novoValorPago >= cliente.valor_total_pacote
          ? 'Pago'
          : novoValorPago > 0
          ? 'Parcial'
          : 'Pendente';

        await base44.entities.Cliente.update(cliente.id, {
          ...cliente,
          valor_pago: novoValorPago,
          status_pagamento: novoStatus
        });
      }
      
      return parcela;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parcelas']);
      queryClient.invalidateQueries(['pagamentos']);
      queryClient.invalidateQueries(['clientes']);
      setShowMarcarPagaDialog(false);
      setSelectedParcela(null);
      resetMarcarPagaForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pagamento.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pagamentos']);
      queryClient.invalidateQueries(['clientes']);
      setShowForm(false);
      setEditingPagamento(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      id_cliente: '',
      valor: 0,
      data_pagamento: new Date().toISOString().split('T')[0],
      forma_pagamento: 'PIX',
      numero_parcela: 1,
      comprovante_url: '',
      observacoes: ''
    });
  };

  const resetParceladoForm = () => {
    setParceladoData({
      id_cliente: '',
      valor_total: 0,
      numero_parcelas: 2,
      data_primeira_parcela: new Date().toISOString().split('T')[0],
      forma_pagamento: 'Cartão Crédito'
    });
  };

  const resetMarcarPagaForm = () => {
    setMarcarPagaData({
      data_pagamento: new Date().toISOString().split('T')[0],
      forma_pagamento: 'PIX',
      comprovante_url: '',
      observacoes: ''
    });
  };

  const handleMarcarPaga = (parcela) => {
    setSelectedParcela(parcela);
    setMarcarPagaData({
      ...marcarPagaData,
      forma_pagamento: parcela.forma_pagamento || 'PIX'
    });
    setShowMarcarPagaDialog(true);
  };

  const handleSubmitMarcarPaga = (e) => {
    e.preventDefault();
    if (selectedParcela) {
      marcarPagaMutation.mutate({
        parcela: selectedParcela,
        dados: marcarPagaData
      });
    }
  };

  const handleComprovanteUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingComprovante(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, comprovante_url: file_url });
    setUploadingComprovante(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPagamento) {
      updateMutation.mutate({ id: editingPagamento.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSubmitParcelado = (e) => {
    e.preventDefault();
    if (!parceladoData.id_cliente) {
      alert('Selecione um cliente');
      return;
    }
    if (parceladoData.valor_total <= 0) {
      alert('Valor total deve ser maior que zero');
      return;
    }
    if (parceladoData.numero_parcelas < 2 || parceladoData.numero_parcelas > 12) {
      alert('Número de parcelas deve ser entre 2 e 12');
      return;
    }
    createParceladoMutation.mutate(parceladoData);
  };

  const handleEdit = (pagamento) => {
    setEditingPagamento(pagamento);
    setFormData({
      id_cliente: pagamento.id_cliente,
      valor: pagamento.valor,
      data_pagamento: pagamento.data_pagamento,
      forma_pagamento: pagamento.forma_pagamento,
      numero_parcela: pagamento.numero_parcela,
      comprovante_url: pagamento.comprovante_url || '',
      observacoes: pagamento.observacoes || ''
    });
    setShowForm(true);
  };

  const pagamentosFiltrados = selectedViagem === "all" 
    ? pagamentos 
    : pagamentos.filter(p => {
        const cliente = clientes.find(c => c.id === p.id_cliente);
        return cliente?.id_viagem === selectedViagem;
      });

  const clientesFiltrados = selectedViagem === "all"
    ? clientes
    : clientes.filter(c => c.id_viagem === selectedViagem);

  const parcelasFiltradas = selectedViagem === "all"
    ? parcelas
    : parcelas.filter(p => p.id_viagem === selectedViagem);
  
  // Atualizar status das parcelas atrasadas
  React.useEffect(() => {
    const hoje = new Date();
    parcelas.forEach(async (parcela) => {
      if (parcela.status === 'Pendente' && new Date(parcela.data_vencimento) < hoje) {
        await base44.entities.Parcela.update(parcela.id, {
          ...parcela,
          status: 'Atrasada'
        });
      }
    });
  }, [parcelas]);

  const totalRecebido = pagamentosFiltrados.reduce((sum, p) => sum + (p.valor || 0), 0);
  const totalAPagar = clientesFiltrados.reduce((sum, c) => 
    sum + ((c.valor_total_pacote || 0) - (c.valor_pago || 0)), 0
  );
  const totalGeral = clientesFiltrados.reduce((sum, c) => sum + (c.valor_total_pacote || 0), 0);
  const totalDespesas = despesasEmpresa.reduce((sum, d) => sum + (d.valor || 0), 0);
  const lucroLiquido = totalRecebido - totalDespesas;

  // Dados para gráfico de formas de pagamento
  const formasPagamento = {};
  pagamentosFiltrados.forEach(p => {
    formasPagamento[p.forma_pagamento] = (formasPagamento[p.forma_pagamento] || 0) + p.valor;
  });
  const formasPagamentoData = Object.entries(formasPagamento).map(([forma, valor]) => ({
    name: forma,
    value: valor
  }));

  // Dados para gráfico mensal (últimos 6 meses)
  const getLast6MonthsData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const receitas = pagamentos.filter(p => {
        const d = new Date(p.data_pagamento);
        return d >= start && d <= end;
      }).reduce((sum, p) => sum + p.valor, 0);
      
      months.push({
        mes: format(date, 'MMM/yy', { locale: ptBR }),
        receitas
      });
    }
    return months;
  };

  const monthlyData = getLast6MonthsData();

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getClienteNome = (id) => {
    const cliente = clientes.find(c => c.id === id);
    return cliente ? cliente.nome_completo : 'N/A';
  };

  const viagemSelecionada = viagens.find(v => v.id === selectedViagem);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Financeiro Profissional</h1>
          <p className="text-gray-500 mt-1">Controle completo de pagamentos, parcelas e recebimentos</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedViagem} onValueChange={setSelectedViagem}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todas as Viagens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Viagens</SelectItem>
              {viagens.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setEditingPagamento(null);
              setShowParceladoForm(true);
            }}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Gerar Parcelas
          </Button>
          <Button
            onClick={() => {
              setEditingPagamento(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pagamento
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="resumo">Resumo Geral</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="clientes">Por Cliente</TabsTrigger>
          <TabsTrigger value="viagens">Por Viagem</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-6">

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-none bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-green-700 font-medium">Total Recebido</p>
                <h3 className="text-3xl font-bold text-green-900 mt-1">
                  R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
            </div>
            <p className="text-xs text-green-600">{pagamentosFiltrados.length} pagamento(s)</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-orange-700 font-medium">A Receber</p>
                <h3 className="text-3xl font-bold text-orange-900 mt-1">
                  R$ {totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-orange-700" />
              </div>
            </div>
            <p className="text-xs text-orange-600">
              {clientesFiltrados.filter(c => c.status_pagamento !== 'Pago').length} pendente(s)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-red-700 font-medium">Total Despesas</p>
                <h3 className="text-3xl font-bold text-red-900 mt-1">
                  R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-700" />
              </div>
            </div>
            <p className="text-xs text-red-600">{despesasEmpresa.length} despesa(s)</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-blue-700 font-medium">Lucro Líquido</p>
                <h3 className={`text-3xl font-bold mt-1 ${lucroLiquido >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                  R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-700" />
              </div>
            </div>
            <p className="text-xs text-blue-600">Receitas - Despesas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Receitas Mensais (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={2} name="Receitas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Pagamentos por Forma</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {formasPagamentoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formasPagamentoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formasPagamentoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-none">
        <CardHeader className="border-b border-gray-100">
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentosFiltrados.map((pagamento) => (
                <TableRow key={pagamento.id} className="hover:bg-gray-50">
                  <TableCell>
                    {format(new Date(pagamento.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getClienteNome(pagamento.id_cliente)}
                  </TableCell>
                  <TableCell className="font-bold text-green-700">
                    R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{pagamento.forma_pagamento}</Badge>
                  </TableCell>
                  <TableCell>{pagamento.numero_parcela}ª</TableCell>
                  <TableCell>
                    {pagamento.comprovante_url ? (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingComprovante(pagamento.comprovante_url)}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4 text-sky-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(pagamento.comprovante_url, '_blank')}
                          title="Baixar"
                        >
                          <Download className="w-4 h-4 text-green-600" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {pagamento.observacoes || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(pagamento)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

        {pagamentosFiltrados.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhum pagamento registrado ainda</p>
          </div>
        )}
        </TabsContent>

        <TabsContent value="alertas">
          <AlertasParcelas 
            parcelas={parcelasFiltradas} 
            clientes={clientesFiltrados}
            onMarcarPaga={handleMarcarPaga}
          />
        </TabsContent>

        <TabsContent value="clientes">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-none">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Selecionar Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {clientesFiltrados.map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => setSelectedCliente(cliente)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedCliente?.id === cliente.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{cliente.nome_completo}</p>
                          <p className="text-sm text-gray-600">{cliente.telefone}</p>
                        </div>
                        <Badge className={
                          cliente.status_pagamento === 'Pago' ? 'bg-green-100 text-green-700' :
                          cliente.status_pagamento === 'Parcial' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {cliente.status_pagamento}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <HistoricoCliente 
              cliente={selectedCliente}
              parcelas={parcelas}
              onMarcarPaga={handleMarcarPaga}
            />
          </div>
        </TabsContent>

        <TabsContent value="viagens">
          <FinanceiroPorViagem 
            viagem={viagemSelecionada}
            clientes={clientesFiltrados}
            parcelas={parcelasFiltradas}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingPagamento ? 'Editar Pagamento' : 'Registrar Pagamento'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={formData.id_cliente}
                onValueChange={(value) => setFormData({...formData, id_cliente: value})}
                required
                disabled={!!editingPagamento}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_completo} - {c.status_pagamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formData.data_pagamento}
                  onChange={(e) => setFormData({...formData, data_pagamento: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select
                  value={formData.forma_pagamento}
                  onValueChange={(value) => setFormData({...formData, forma_pagamento: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                    <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número da Parcela</Label>
                <Input
                  type="number"
                  value={formData.numero_parcela}
                  onChange={(e) => setFormData({...formData, numero_parcela: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comprovante de Pagamento</Label>
              <div className="flex gap-4 items-start">
                {formData.comprovante_url && (
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden">
                      {formData.comprovante_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img src={formData.comprovante_url} alt="Comprovante" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleComprovanteUpload}
                    disabled={uploadingComprovante}
                  />
                  {uploadingComprovante && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando comprovante...
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Formatos aceitos: JPG, PNG, PDF</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Informações adicionais"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowForm(false);
                setEditingPagamento(null);
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingPagamento ? 'Atualizar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showParceladoForm} onOpenChange={setShowParceladoForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
              Gerar Parcelas Automáticas
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Configure o parcelamento e o sistema irá gerar todas as parcelas automaticamente
            </p>
          </DialogHeader>
          
          <form onSubmit={handleSubmitParcelado} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={parceladoData.id_cliente}
                onValueChange={(value) => {
                  const cliente = clientes.find(c => c.id === value);
                  setParceladoData({
                    ...parceladoData, 
                    id_cliente: value,
                    valor_total: cliente?.valor_total_pacote || 0
                  });
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.filter(c => c.forma_pagamento === 'Parcelado' || c.forma_pagamento === 'Boleto').map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_completo} - R$ {(c.valor_total_pacote || 0).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Total (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={parceladoData.valor_total}
                  onChange={(e) => setParceladoData({...parceladoData, valor_total: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Número de Parcelas *</Label>
                <Select
                  value={parceladoData.numero_parcelas.toString()}
                  onValueChange={(value) => setParceladoData({...parceladoData, numero_parcelas: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da 1ª Parcela *</Label>
                <Input
                  type="date"
                  value={parceladoData.data_primeira_parcela}
                  onChange={(e) => setParceladoData({...parceladoData, data_primeira_parcela: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select
                  value={parceladoData.forma_pagamento}
                  onValueChange={(value) => setParceladoData({...parceladoData, forma_pagamento: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="PIX">PIX Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {parceladoData.valor_total > 0 && parceladoData.numero_parcelas > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-semibold mb-2">Resumo do Parcelamento:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Valor de cada parcela: <strong>R$ {(parceladoData.valor_total / parceladoData.numero_parcelas).toFixed(2)}</strong></li>
                  <li>• Total de parcelas: <strong>{parceladoData.numero_parcelas}x</strong></li>
                  <li>• Primeira parcela vence em: <strong>{format(new Date(parceladoData.data_primeira_parcela), "dd/MM/yyyy")}</strong></li>
                  <li>• Última parcela vence em: <strong>{format(addMonths(new Date(parceladoData.data_primeira_parcela), parceladoData.numero_parcelas - 1), "dd/MM/yyyy")}</strong></li>
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowParceladoForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createParceladoMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                {createParceladoMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Gerar Parcelas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showMarcarPagaDialog} onOpenChange={setShowMarcarPagaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Marcar Parcela como Paga
            </DialogTitle>
          </DialogHeader>
          
          {selectedParcela && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Parcela {selectedParcela.numero_parcela}/{selectedParcela.total_parcelas}</strong>
              </p>
              <p className="text-sm text-blue-800">
                Valor: R$ {selectedParcela.valor_parcela.toFixed(2)}
              </p>
              <p className="text-sm text-blue-700">
                Vencimento: {format(new Date(selectedParcela.data_vencimento), "dd/MM/yyyy")}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmitMarcarPaga} className="space-y-4">
            <div className="space-y-2">
              <Label>Data do Pagamento *</Label>
              <Input
                type="date"
                value={marcarPagaData.data_pagamento}
                onChange={(e) => setMarcarPagaData({...marcarPagaData, data_pagamento: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select
                value={marcarPagaData.forma_pagamento}
                onValueChange={(value) => setMarcarPagaData({...marcarPagaData, forma_pagamento: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                  <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={marcarPagaData.observacoes}
                onChange={(e) => setMarcarPagaData({...marcarPagaData, observacoes: e.target.value})}
                placeholder="Informações adicionais"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMarcarPagaDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={marcarPagaMutation.isPending} className="bg-green-600 hover:bg-green-700">
                {marcarPagaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingComprovante} onOpenChange={() => setViewingComprovante(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {viewingComprovante?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img src={viewingComprovante} alt="Comprovante" className="max-w-full max-h-[70vh] object-contain" />
            ) : (
              <iframe src={viewingComprovante} className="w-full h-[70vh]" />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => window.open(viewingComprovante, '_blank')}>
              <Download className="w-4 h-4 mr-2" />
              Baixar Comprovante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}