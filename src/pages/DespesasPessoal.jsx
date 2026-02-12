import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, DollarSign, Loader2, Trash2, Edit, CheckCircle2, Clock, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIAS = ['Salário', 'Comissão', 'Vale Transporte', 'Vale Alimentação', 'Bonificação', 'Outros'];
const FORMAS_PAGAMENTO = ['PIX', 'Dinheiro', 'Transferência', 'Boleto', 'Cartão Débito'];

export default function DespesasPessoal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("all");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [usarOutraCategoria, setUsarOutraCategoria] = useState(false);

  const [formData, setFormData] = useState({
    descricao: '', categoria: 'Salário', id_membro_equipe: '',
    valor: 0, data_pagamento: '', data_vencimento: '',
    status: 'Pendente', forma_pagamento: 'PIX', observacoes: ''
  });

  const { data: despesas = [], isLoading } = useQuery({
    queryKey: ['despesas-pessoal'],
    queryFn: async () => {
      const { data } = await supabase.from('despesas_pessoal').select('*').order('created_at', { ascending: false });
      return data || [];
    }
  });

  const { data: equipe = [] } = useQuery({
    queryKey: ['equipe'],
    queryFn: async () => {
      const { data } = await supabase.from('equipe').select('*').order('nome');
      return data || [];
    }
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('despesas-pessoal-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'despesas_pessoal' }, () => {
        queryClient.invalidateQueries({ queryKey: ['despesas-pessoal'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editing) {
        const { error } = await supabase.from('despesas_pessoal').update(data).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('despesas_pessoal').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-pessoal'] });
      setShowForm(false);
      setEditing(null);
      toast({ title: editing ? "✅ Despesa atualizada!" : "✅ Despesa registrada!" });
    },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('despesas_pessoal').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-pessoal'] });
      toast({ title: "🗑️ Despesa removida!" });
    }
  });

  const marcarPagaMutation = useMutation({
    mutationFn: async (despesa) => {
      const { error } = await supabase.from('despesas_pessoal').update({
        status: 'Pago',
        data_pagamento: new Date().toISOString().split('T')[0]
      }).eq('id', despesa.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-pessoal'] });
      toast({ title: "✅ Marcado como pago!" });
    }
  });

  const handleEdit = (d) => {
    setEditing(d);
    const isCustom = !CATEGORIAS.includes(d.categoria);
    setUsarOutraCategoria(isCustom);
    setFormData({
      descricao: d.descricao, categoria: d.categoria, id_membro_equipe: d.id_membro_equipe || '',
      valor: d.valor, data_pagamento: d.data_pagamento || '', data_vencimento: d.data_vencimento || '',
      status: d.status, forma_pagamento: d.forma_pagamento || 'PIX', observacoes: d.observacoes || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      descricao: '', categoria: 'Salário', id_membro_equipe: '',
      valor: 0, data_pagamento: '', data_vencimento: '',
      status: 'Pendente', forma_pagamento: 'PIX', observacoes: ''
    });
    setEditing(null);
    setUsarOutraCategoria(false);
    setEditing(null);
  };

  const getMembro = (id) => equipe.find(e => e.id === id);

  const filtered = despesas.filter(d => {
    if (filtroCategoria !== "all" && d.categoria !== filtroCategoria) return false;
    if (filtroStatus !== "all" && d.status !== filtroStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const membro = getMembro(d.id_membro_equipe);
      if (!d.descricao?.toLowerCase().includes(term) && !membro?.nome?.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const totalGeral = filtered.reduce((s, d) => s + (d.valor || 0), 0);
  const totalPago = filtered.filter(d => d.status === 'Pago').reduce((s, d) => s + (d.valor || 0), 0);
  const totalPendente = filtered.filter(d => d.status === 'Pendente').reduce((s, d) => s + (d.valor || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👥 Despesas com Pessoal</h1>
          <p className="text-gray-500 mt-1">Salários, comissões, vales e bonificações</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Nova Despesa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-none bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-5">
            <p className="text-sm text-blue-700 font-medium">Total Geral</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-none bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-5">
            <p className="text-sm text-green-700 font-medium">Total Pago</p>
            <h3 className="text-2xl font-bold text-green-900 mt-1">R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-none bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-5">
            <p className="text-sm text-orange-700 font-medium">Pendente</p>
            <h3 className="text-2xl font-bold text-orange-900 mt-1">R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Pago">Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Membro</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Nenhuma despesa encontrada</TableCell></TableRow>
              ) : filtered.map(d => {
                const membro = getMembro(d.id_membro_equipe);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.descricao}</TableCell>
                    <TableCell><Badge variant="outline">{d.categoria}</Badge></TableCell>
                    <TableCell>{membro?.nome || '-'}</TableCell>
                    <TableCell className="font-bold">R$ {(d.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{d.data_vencimento ? format(new Date(d.data_vencimento), "dd/MM/yyyy") : '-'}</TableCell>
                    <TableCell>
                      <Badge className={d.status === 'Pago' ? 'bg-green-200 text-green-900' : 'bg-orange-200 text-orange-900'}>
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {d.status === 'Pendente' && (
                          <Button size="sm" variant="ghost" onClick={() => marcarPagaMutation.mutate(d)} title="Marcar como Pago">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(d)}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm('Remover esta despesa?')) deleteMutation.mutate(d.id); }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Despesa' : 'Nova Despesa com Pessoal'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
            <div>
              <Label>Descrição *</Label>
              <Input value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria *</Label>
                {usarOutraCategoria ? (
                  <div className="flex gap-2">
                    <Input value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} placeholder="Digite a categoria..." required />
                    <Button type="button" variant="outline" size="sm" onClick={() => { setUsarOutraCategoria(false); setFormData({ ...formData, categoria: 'Salário' }); }}>
                      Voltar
                    </Button>
                  </div>
                ) : (
                  <Select value={formData.categoria} onValueChange={v => {
                    if (v === '__outros__') { setUsarOutraCategoria(true); setFormData({ ...formData, categoria: '' }); }
                    else setFormData({ ...formData, categoria: v });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      <SelectItem value="__outros__">✏️ Outros (digitar)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Membro da Equipe</Label>
                <Select value={formData.id_membro_equipe || "none"} onValueChange={v => setFormData({ ...formData, id_membro_equipe: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {equipe.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={formData.valor || ''} onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={formData.forma_pagamento} onValueChange={v => setFormData({ ...formData, forma_pagamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Vencimento</Label>
                <Input type="date" value={formData.data_vencimento} onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })} />
              </div>
              <div>
                <Label>Data Pagamento</Label>
                <Input type="date" value={formData.data_pagamento} onChange={e => setFormData({ ...formData, data_pagamento: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!formData.descricao || formData.valor <= 0 || saveMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editing ? 'Atualizar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
