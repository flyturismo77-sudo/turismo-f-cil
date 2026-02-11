import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Building2, Edit, Trash2, Loader2, Search } from 'lucide-react';

const tipoColors = {
  "Hotel": "bg-purple-100 text-purple-700",
  "Ônibus": "bg-blue-100 text-blue-700",
  "Alimentação": "bg-green-100 text-green-700",
  "Guia Turístico": "bg-pink-100 text-pink-700",
  "Agência": "bg-amber-100 text-amber-700",
  "Outros": "bg-gray-100 text-gray-700"
};

export default function Fornecedores() {
  const [showForm, setShowForm] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nome: '',
    tipo_servico: 'Hotel',
    contato: '',
    cnpj: '',
    endereco: '',
    observacoes: ''
  });

  const queryClient = useQueryClient();

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => base44.entities.Fornecedor.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Fornecedor.create({ ...data, tipo: data.tipo_servico || data.tipo }),
    onSuccess: () => {
      queryClient.invalidateQueries(['fornecedores']);
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Fornecedor.update(id, { ...data, tipo: data.tipo_servico || data.tipo }),
    onSuccess: () => {
      queryClient.invalidateQueries(['fornecedores']);
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Fornecedor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['fornecedores']);
    },
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo_servico: 'Hotel',
      contato: '',
      cnpj: '',
      endereco: '',
      observacoes: ''
    });
    setEditingFornecedor(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingFornecedor) {
      updateMutation.mutate({ id: editingFornecedor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({
      nome: fornecedor.nome || '',
      tipo_servico: fornecedor.tipo_servico || 'Hotel',
      contato: fornecedor.contato || '',
      cnpj: fornecedor.cnpj || '',
      endereco: fornecedor.endereco || '',
      observacoes: fornecedor.observacoes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (fornecedor) => {
    if (confirm(`Tem certeza que deseja excluir "${fornecedor.nome}"?`)) {
      deleteMutation.mutate(fornecedor.id);
    }
  };

  const filteredFornecedores = fornecedores.filter(f =>
    f.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj?.includes(searchTerm) ||
    f.tipo_servico?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-500 mt-1">Gerencie seus fornecedores e prestadores de serviços</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar fornecedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFornecedores.map((fornecedor) => (
          <Card key={fornecedor.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
            <CardHeader className="border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{fornecedor.nome}</h3>
                    <Badge className={tipoColors[fornecedor.tipo_servico]}>
                      {fornecedor.tipo_servico}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 text-sm">
                {fornecedor.cnpj && (
                  <p><span className="text-gray-600">CNPJ:</span> <span className="font-medium">{fornecedor.cnpj}</span></p>
                )}
                <p><span className="text-gray-600">Contato:</span> <span className="font-medium">{fornecedor.contato}</span></p>
                {fornecedor.endereco && (
                  <p><span className="text-gray-600">Endereço:</span> <span className="font-medium">{fornecedor.endereco}</span></p>
                )}
                {fornecedor.observacoes && (
                  <p className="text-gray-600 italic text-xs mt-2">{fornecedor.observacoes}</p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(fornecedor)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(fornecedor)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFornecedores.length === 0 && (
        <Card className="shadow-lg border-none">
          <CardContent className="p-12 text-center text-gray-500">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhum fornecedor cadastrado</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Serviço *</Label>
                <Select value={formData.tipo_servico} onValueChange={(value) => setFormData({...formData, tipo_servico: value})} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hotel">Hotel</SelectItem>
                    <SelectItem value="Ônibus">Ônibus</SelectItem>
                    <SelectItem value="Alimentação">Alimentação</SelectItem>
                    <SelectItem value="Guia Turístico">Guia Turístico</SelectItem>
                    <SelectItem value="Agência">Agência</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contato *</Label>
                <Input
                  value={formData.contato}
                  onChange={(e) => setFormData({...formData, contato: e.target.value})}
                  placeholder="Telefone ou e-mail"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingFornecedor ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}