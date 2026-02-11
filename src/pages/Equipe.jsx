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
import { Plus, Users, Edit, Trash2, Loader2, Search, UserCircle } from 'lucide-react';

const funcaoColors = {
  "Motorista": "bg-blue-100 text-blue-700",
  "Guia": "bg-green-100 text-green-700",
  "Assistente": "bg-purple-100 text-purple-700",
  "Coordenador": "bg-amber-100 text-amber-700"
};

export default function Equipe() {
  const [showForm, setShowForm] = useState(false);
  const [editingMembro, setEditingMembro] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nome_completo: '',
    funcao: 'Guia',
    telefone: '',
    email: '',
    cpf: '',
    id_viagem: '',
    status: 'Ativo'
  });

  const queryClient = useQueryClient();

  const { data: equipe = [] } = useQuery({
    queryKey: ['equipe'],
    queryFn: () => base44.entities.Equipe.list('-created_date'),
  });

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: () => base44.entities.Viagem.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipe.create({ ...data, nome: data.nome_completo || data.nome }),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipe']);
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipe.update(id, { ...data, nome: data.nome_completo || data.nome }),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipe']);
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipe.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipe']);
    },
  });

  const resetForm = () => {
    setFormData({
      nome_completo: '',
      funcao: 'Guia',
      telefone: '',
      email: '',
      cpf: '',
      id_viagem: '',
      status: 'Ativo'
    });
    setEditingMembro(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMembro) {
      updateMutation.mutate({ id: editingMembro.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (membro) => {
    setEditingMembro(membro);
    setFormData({
      nome_completo: membro.nome_completo || '',
      funcao: membro.funcao || 'Guia',
      telefone: membro.telefone || '',
      email: membro.email || '',
      cpf: membro.cpf || '',
      id_viagem: membro.id_viagem || '',
      status: membro.status || 'Ativo'
    });
    setShowForm(true);
  };

  const handleDelete = (membro) => {
    if (confirm(`Tem certeza que deseja excluir "${membro.nome_completo}"?`)) {
      deleteMutation.mutate(membro.id);
    }
  };

  const filteredEquipe = equipe.filter(m =>
    m.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.funcao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.cpf?.includes(searchTerm)
  );

  const getViagemNome = (id) => {
    const viagem = viagens.find(v => v.id === id);
    return viagem ? viagem.nome : 'Sem viagem';
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipe</h1>
          <p className="text-gray-500 mt-1">Gerencie os membros da equipe de viagens</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar membros..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipe.map((membro) => (
          <Card key={membro.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
            <CardHeader className="border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{membro.nome_completo}</h3>
                    <Badge className={funcaoColors[membro.funcao]}>
                      {membro.funcao}
                    </Badge>
                  </div>
                </div>
                <Badge variant={membro.status === 'Ativo' ? 'default' : 'secondary'}>
                  {membro.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">Telefone:</span> <span className="font-medium">{membro.telefone}</span></p>
                {membro.email && (
                  <p><span className="text-gray-600">E-mail:</span> <span className="font-medium">{membro.email}</span></p>
                )}
                {membro.cpf && (
                  <p><span className="text-gray-600">CPF:</span> <span className="font-medium">{membro.cpf}</span></p>
                )}
                {membro.id_viagem && (
                  <p><span className="text-gray-600">Viagem:</span> <span className="font-medium">{getViagemNome(membro.id_viagem)}</span></p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(membro)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(membro)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipe.length === 0 && (
        <Card className="shadow-lg border-none">
          <CardContent className="p-12 text-center text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhum membro cadastrado</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingMembro ? 'Editar Membro' : 'Novo Membro'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Função *</Label>
                <Select value={formData.funcao} onValueChange={(value) => setFormData({...formData, funcao: value})} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Motorista">Motorista</SelectItem>
                    <SelectItem value="Guia">Guia</SelectItem>
                    <SelectItem value="Assistente">Assistente</SelectItem>
                    <SelectItem value="Coordenador">Coordenador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Viagem (Opcional)</Label>
              <Select value={formData.id_viagem} onValueChange={(value) => setFormData({...formData, id_viagem: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma viagem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem viagem</SelectItem>
                  {viagens.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingMembro ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}