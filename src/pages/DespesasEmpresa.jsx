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
import { Plus, Building2, Loader2, Trash2, Edit, Search, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIAS = ['Água', 'Luz', 'Internet', 'Aluguel', 'Telefone', 'Combustível', 'Manutenção', 'Pedágio', 'Material de Escritório', 'Seguros', 'Impostos', 'Outros'];
const FORMAS_PAGAMENTO = ['PIX', 'Boleto', 'Dinheiro', 'Transferência', 'Cartão Débito', 'Cartão Crédito'];

export default function DespesasEmpresa() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("all");

  const [formData, setFormData] = useState({
    descricao: '', categoria: 'Outros', valor: 0, data_pagamento: '',
    id_viagem: '', fornecedor: '', observacoes: ''
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ['pagamentos-empresa'],
    queryFn: async () => {
      const { data } = await supabase.from('pagamentos_empresa').select('*').order('created_at', { ascending: false });
      return data || [];
    }
  });

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: async () => {
      const { data } = await supabase.from('viagens').select('*').order('created_at', { ascending: false });
      return data || [];
    }
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('despesas-empresa-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagamentos_empresa' }, () => {
        queryClient.invalidateQueries({ queryKey: ['pagamentos-empresa'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, id_viagem: data.id_viagem || null };
      if (editing) {
        const { error } = await supabase.from('pagamentos_empresa').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pagamentos_empresa').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos-empresa'] });
      setShowForm(false);
      setEditing(null);
      toast({ title: editing ? "✅ Despesa atualizada!" : "✅ Despesa registrada!" });
    },
    onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('pagamentos_empresa').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos-empresa'] });
      toast({ title: "🗑️ Despesa removida!" });
    }
  });

  const handleEdit = (d) => {
    setEditing(d);
    setFormData({
      descricao: d.descricao, categoria: d.categoria || 'Outros', valor: d.valor,
      data_pagamento: d.data_pagamento || '', id_viagem: d.id_viagem || '',
      fornecedor: d.fornecedor || '', observacoes: d.observacoes || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ descricao: '', categoria: 'Outros', valor: 0, data_pagamento: '', id_viagem: '', fornecedor: '', observacoes: '' });
    setEditing(null);
  };

  const getViagem = (id) => viagens.find(v => v.id === id);

  const filtered = despesas.filter(d => {
    if (filtroCategoria !== "all" && d.categoria !== filtroCategoria) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!d.descricao?.toLowerCase().includes(term) && !d.fornecedor?.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const totalGeral = filtered.reduce((s, d) => s + (d.valor || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏢 Despesas da Empresa</h1>
          <p className="text-gray-500 mt-1">Custos operacionais, contas fixas e variáveis</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Nova Despesa
        </Button>
      </div>

      {/* Stats */}
      <Card className="shadow-lg border-none bg-gradient-to-br from-rose-50 to-rose-100">
        <CardContent className="p-5">
          <p className="text-sm text-rose-700 font-medium">Total de Despesas</p>
          <h3 className="text-2xl font-bold text-rose-900 mt-1">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-xs text-rose-600 mt-1">{filtered.length} registro(s)</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                <TableHead>Fornecedor</TableHead>
                <TableHead>Viagem</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data Pgto</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Nenhuma despesa encontrada</TableCell></TableRow>
              ) : filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.descricao}</TableCell>
                  <TableCell><Badge variant="outline">{d.categoria || 'Outros'}</Badge></TableCell>
                  <TableCell>{d.fornecedor || '-'}</TableCell>
                  <TableCell>{getViagem(d.id_viagem)?.nome || '-'}</TableCell>
                  <TableCell className="font-bold text-rose-700">R$ {(d.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{d.data_pagamento ? format(new Date(d.data_pagamento), "dd/MM/yyyy") : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(d)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm('Remover esta despesa?')) deleteMutation.mutate(d.id); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Despesa' : 'Nova Despesa da Empresa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
            <div>
              <Label>Descrição *</Label>
              <Input value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria *</Label>
                <Select value={formData.categoria} onValueChange={v => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={formData.valor || ''} onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fornecedor</Label>
                <Input value={formData.fornecedor} onChange={e => setFormData({ ...formData, fornecedor: e.target.value })} />
              </div>
              <div>
                <Label>Data Pagamento</Label>
                <Input type="date" value={formData.data_pagamento} onChange={e => setFormData({ ...formData, data_pagamento: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Viagem (opcional)</Label>
              <Select value={formData.id_viagem || "none"} onValueChange={v => setFormData({ ...formData, id_viagem: v === "none" ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {viagens.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!formData.descricao || formData.valor <= 0 || saveMutation.isPending} className="bg-rose-600 hover:bg-rose-700">
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
