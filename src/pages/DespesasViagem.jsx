import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, Trash2, Edit, Building2, Users, DollarSign, Plane, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIAS_EMPRESA = ['Água', 'Luz', 'Internet', 'Aluguel', 'Telefone', 'Combustível', 'Manutenção', 'Pedágio', 'Material de Escritório', 'Seguros', 'Impostos', 'Hospedagem', 'Alimentação', 'Transporte', 'Passeios', 'Guia', 'Outros'];
const CATEGORIAS_PESSOAL = ['Salário', 'Diária', 'Comissão', 'Ajuda de Custo', 'Vale Alimentação', 'Vale Transporte', 'Bonificação', 'Outros'];
const FORMAS_PAGAMENTO = ['PIX', 'Boleto', 'Dinheiro', 'Transferência', 'Cartão Débito', 'Cartão Crédito'];

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function DespesasViagem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viagemFiltro, setViagemFiltro] = useState("todas");
  const [showForm, setShowForm] = useState(false);
  const [tipoDespesa, setTipoDespesa] = useState("empresa");
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formEmpresa, setFormEmpresa] = useState({
    descricao: '', categoria: 'Outros', valor: 0, data_pagamento: '',
    fornecedor: '', observacoes: '', id_viagem: ''
  });

  const [formPessoal, setFormPessoal] = useState({
    descricao: '', categoria: 'Salário', valor: 0, data_pagamento: '',
    id_membro_equipe: '', forma_pagamento: 'PIX', status: 'Pendente', observacoes: '', id_viagem: ''
  });

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens-desp'],
    queryFn: async () => {
      const { data } = await supabase.from('viagens').select('id, nome, destino').eq('arquivada', false).order('data_saida', { ascending: false });
      return data || [];
    }
  });

  const { data: despesasEmpresa = [] } = useQuery({
    queryKey: ['despesas-empresa-all'],
    queryFn: async () => {
      const { data } = await supabase.from('pagamentos_empresa').select('*').not('id_viagem', 'is', null).order('created_at', { ascending: false });
      return data || [];
    }
  });

  const { data: despesasPessoal = [] } = useQuery({
    queryKey: ['despesas-pessoal-all'],
    queryFn: async () => {
      const { data } = await supabase.from('despesas_pessoal').select('*').not('id_viagem', 'is', null).order('created_at', { ascending: false });
      return data || [];
    }
  });

  const { data: equipe = [] } = useQuery({
    queryKey: ['equipe-desp'],
    queryFn: async () => {
      const { data } = await supabase.from('equipe').select('id, nome').eq('ativo', true);
      return data || [];
    }
  });

  // Realtime
  useEffect(() => {
    const ch1 = supabase.channel('desp-emp-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagamentos_empresa' }, () => {
        queryClient.invalidateQueries({ queryKey: ['despesas-empresa-all'] });
      }).subscribe();
    const ch2 = supabase.channel('desp-pes-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'despesas_pessoal' }, () => {
        queryClient.invalidateQueries({ queryKey: ['despesas-pessoal-all'] });
      }).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [queryClient]);

  const saveEmpresaMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      if (editing) {
        const { error } = await supabase.from('pagamentos_empresa').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pagamentos_empresa').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-empresa-all'] });
      setShowForm(false); setEditing(null);
      toast({ title: editing ? "✅ Despesa atualizada!" : "✅ Despesa registrada!" });
    },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  const savePessoalMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, id_membro_equipe: data.id_membro_equipe || null };
      if (editing) {
        const { error } = await supabase.from('despesas_pessoal').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('despesas_pessoal').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-pessoal-all'] });
      setShowForm(false); setEditing(null);
      toast({ title: editing ? "✅ Despesa atualizada!" : "✅ Despesa registrada!" });
    },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  const deleteEmpresaMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('pagamentos_empresa').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-empresa-all'] });
      toast({ title: "🗑️ Despesa removida!" });
    }
  });

  const deletePessoalMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('despesas_pessoal').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-pessoal-all'] });
      toast({ title: "🗑️ Despesa removida!" });
    }
  });

  const openNewForm = (tipo) => {
    setTipoDespesa(tipo);
    setEditing(null);
    const viagemId = viagemFiltro !== 'todas' ? viagemFiltro : '';
    if (tipo === 'empresa') {
      setFormEmpresa({ descricao: '', categoria: 'Outros', valor: 0, data_pagamento: '', fornecedor: '', observacoes: '', id_viagem: viagemId });
    } else {
      setFormPessoal({ descricao: '', categoria: 'Salário', valor: 0, data_pagamento: '', id_membro_equipe: '', forma_pagamento: 'PIX', status: 'Pendente', observacoes: '', id_viagem: viagemId });
    }
    setShowForm(true);
  };

  const handleEditEmpresa = (d) => {
    setEditing(d); setTipoDespesa('empresa');
    setFormEmpresa({
      descricao: d.descricao, categoria: d.categoria || 'Outros', valor: d.valor,
      data_pagamento: d.data_pagamento || '', fornecedor: d.fornecedor || '', observacoes: d.observacoes || '', id_viagem: d.id_viagem || ''
    });
    setShowForm(true);
  };

  const handleEditPessoal = (d) => {
    setEditing(d); setTipoDespesa('pessoal');
    setFormPessoal({
      descricao: d.descricao, categoria: d.categoria || 'Salário', valor: d.valor,
      data_pagamento: d.data_pagamento || '', id_membro_equipe: d.id_membro_equipe || '',
      forma_pagamento: d.forma_pagamento || 'PIX', status: d.status || 'Pendente', observacoes: d.observacoes || '', id_viagem: d.id_viagem || ''
    });
    setShowForm(true);
  };

  const getViagem = (id) => viagens.find(v => v.id === id);
  const getMembro = (id) => equipe.find(e => e.id === id);

  const filteredEmpresa = despesasEmpresa.filter(d => {
    if (viagemFiltro !== 'todas' && d.id_viagem !== viagemFiltro) return false;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      if (!d.descricao?.toLowerCase().includes(t) && !d.fornecedor?.toLowerCase().includes(t)) return false;
    }
    return true;
  });

  const filteredPessoal = despesasPessoal.filter(d => {
    if (viagemFiltro !== 'todas' && d.id_viagem !== viagemFiltro) return false;
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      if (!d.descricao?.toLowerCase().includes(t)) return false;
    }
    return true;
  });

  const totalEmpresa = filteredEmpresa.reduce((s, d) => s + (d.valor || 0), 0);
  const totalPessoal = filteredPessoal.reduce((s, d) => s + (d.valor || 0), 0);
  const totalGeral = totalEmpresa + totalPessoal;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">💰 Despesas por Viagem</h1>
          <p className="text-muted-foreground mt-1">Todas as despesas vinculadas a viagens</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openNewForm('empresa')} className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700">
            <Plus className="w-4 h-4 mr-2" /> Desp. Empresa
          </Button>
          <Button onClick={() => openNewForm('pessoal')} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
            <Plus className="w-4 h-4 mr-2" /> Desp. Pessoal
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar descrição ou fornecedor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={viagemFiltro} onValueChange={setViagemFiltro}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999] bg-popover">
            <SelectItem value="todas">Todas as viagens</SelectItem>
            {viagens.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-rose-500" />
              <p className="text-sm text-muted-foreground font-medium">Despesas Empresa</p>
            </div>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{fmt(totalEmpresa)}</p>
            <p className="text-xs text-muted-foreground">{filteredEmpresa.length} registro(s)</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-orange-500" />
              <p className="text-sm text-muted-foreground font-medium">Despesas Pessoal</p>
            </div>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{fmt(totalPessoal)}</p>
            <p className="text-xs text-muted-foreground">{filteredPessoal.length} registro(s)</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-red-500" />
              <p className="text-sm text-muted-foreground font-medium">Total Geral</p>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{fmt(totalGeral)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="empresa">🏢 Empresa ({filteredEmpresa.length})</TabsTrigger>
          <TabsTrigger value="pessoal">👥 Pessoal ({filteredPessoal.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Viagem</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Pgto</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmpresa.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma despesa encontrada</TableCell></TableRow>
                  ) : filteredEmpresa.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.descricao}</TableCell>
                      <TableCell>
                        <span className="text-sky-600 dark:text-sky-400 text-xs font-medium">{getViagem(d.id_viagem)?.nome || '-'}</span>
                      </TableCell>
                      <TableCell><Badge variant="outline">{d.categoria || 'Outros'}</Badge></TableCell>
                      <TableCell>{d.fornecedor || '-'}</TableCell>
                      <TableCell className="font-bold text-rose-700 dark:text-rose-400">{fmt(d.valor)}</TableCell>
                      <TableCell>{d.data_pagamento ? format(new Date(d.data_pagamento), "dd/MM/yyyy") : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditEmpresa(d)}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm('Remover?')) deleteEmpresaMutation.mutate(d.id); }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pessoal">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Viagem</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Membro</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Pgto</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPessoal.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma despesa encontrada</TableCell></TableRow>
                  ) : filteredPessoal.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.descricao}</TableCell>
                      <TableCell>
                        <span className="text-sky-600 dark:text-sky-400 text-xs font-medium">{getViagem(d.id_viagem)?.nome || '-'}</span>
                      </TableCell>
                      <TableCell><Badge variant="outline">{d.categoria}</Badge></TableCell>
                      <TableCell>{getMembro(d.id_membro_equipe)?.nome || '-'}</TableCell>
                      <TableCell className="font-bold text-orange-700 dark:text-orange-400">{fmt(d.valor)}</TableCell>
                      <TableCell>
                        <Badge className={d.status === 'Pago' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{d.data_pagamento ? format(new Date(d.data_pagamento), "dd/MM/yyyy") : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditPessoal(d)}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm('Remover?')) deletePessoalMutation.mutate(d.id); }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Despesa' : tipoDespesa === 'empresa' ? '🏢 Nova Despesa Empresa' : '👥 Nova Despesa Pessoal'}
            </DialogTitle>
          </DialogHeader>

          {tipoDespesa === 'empresa' ? (
            <form onSubmit={e => { e.preventDefault(); saveEmpresaMutation.mutate(formEmpresa); }} className="space-y-4">
              <div>
                <Label>Viagem *</Label>
                <Select value={formEmpresa.id_viagem || "none"} onValueChange={v => setFormEmpresa({ ...formEmpresa, id_viagem: v === "none" ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {viagens.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição *</Label>
                <Input value={formEmpresa.descricao} onChange={e => setFormEmpresa({ ...formEmpresa, descricao: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={formEmpresa.categoria} onValueChange={v => setFormEmpresa({ ...formEmpresa, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_EMPRESA.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" value={formEmpresa.valor || ''} onChange={e => setFormEmpresa({ ...formEmpresa, valor: parseFloat(e.target.value) || 0 })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fornecedor</Label>
                  <Input value={formEmpresa.fornecedor} onChange={e => setFormEmpresa({ ...formEmpresa, fornecedor: e.target.value })} />
                </div>
                <div>
                  <Label>Data Pagamento</Label>
                  <Input type="date" value={formEmpresa.data_pagamento} onChange={e => setFormEmpresa({ ...formEmpresa, data_pagamento: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={formEmpresa.observacoes} onChange={e => setFormEmpresa({ ...formEmpresa, observacoes: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!formEmpresa.descricao || !formEmpresa.id_viagem || formEmpresa.valor <= 0 || saveEmpresaMutation.isPending} className="bg-rose-600 hover:bg-rose-700">
                  {saveEmpresaMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editing ? 'Atualizar' : 'Registrar'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={e => { e.preventDefault(); savePessoalMutation.mutate(formPessoal); }} className="space-y-4">
              <div>
                <Label>Viagem *</Label>
                <Select value={formPessoal.id_viagem || "none"} onValueChange={v => setFormPessoal({ ...formPessoal, id_viagem: v === "none" ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {viagens.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição *</Label>
                <Input value={formPessoal.descricao} onChange={e => setFormPessoal({ ...formPessoal, descricao: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={formPessoal.categoria} onValueChange={v => setFormPessoal({ ...formPessoal, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_PESSOAL.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" value={formPessoal.valor || ''} onChange={e => setFormPessoal({ ...formPessoal, valor: parseFloat(e.target.value) || 0 })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Membro da Equipe</Label>
                  <Select value={formPessoal.id_membro_equipe || "none"} onValueChange={v => setFormPessoal({ ...formPessoal, id_membro_equipe: v === "none" ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {equipe.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma Pagamento</Label>
                  <Select value={formPessoal.forma_pagamento} onValueChange={v => setFormPessoal({ ...formPessoal, forma_pagamento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={formPessoal.status} onValueChange={v => setFormPessoal({ ...formPessoal, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data Pagamento</Label>
                  <Input type="date" value={formPessoal.data_pagamento} onChange={e => setFormPessoal({ ...formPessoal, data_pagamento: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={formPessoal.observacoes} onChange={e => setFormPessoal({ ...formPessoal, observacoes: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!formPessoal.descricao || !formPessoal.id_viagem || formPessoal.valor <= 0 || savePessoalMutation.isPending} className="bg-orange-600 hover:bg-orange-700">
                  {savePessoalMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editing ? 'Atualizar' : 'Registrar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
