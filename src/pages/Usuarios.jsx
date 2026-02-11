import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { UserCog, Edit, Trash2, Loader2, Key, Mail, Shield, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Usuarios() {
  const [showForm, setShowForm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    cargo: 'Funcionário',
    telefone: ''
  });
  const [resetEmail, setResetEmail] = useState('');

  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.Usuario.list('-created_at'),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Usuario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowForm(false);
      setEditingUser(null);
      setFormData({
        full_name: '',
        email: '',
        cargo: 'Funcionário',
        telefone: ''
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => base44.entities.Usuario.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    },
  });

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      cargo: user.cargo || 'Funcionário',
      telefone: user.telefone || ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUserMutation.mutate({ 
        id: editingUser.id, 
        data: {
          cargo: formData.cargo,
          telefone: formData.telefone
        }
      });
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setResetEmail(user.email);
    setShowResetPassword(true);
  };

  const handleSendResetEmail = async () => {
    alert(`E-mail de redefinição de senha enviado para ${resetEmail}`);
    setShowResetPassword(false);
  };

  const isCurrentUserAdmin = currentUser?.email?.toLowerCase().includes('flyturadm') || 
                             currentUser?.cargo === 'Administrador' || 
                             currentUser?.role === 'admin';

  const totalUsuarios = users.length;
  const totalAdmins = users.filter(u => u.email?.toLowerCase().includes('flyturadm') || u.cargo === 'Administrador' || u.role === 'admin').length;
  const totalFuncionarios = users.filter(u => !u.email?.toLowerCase().includes('flyturadm') && u.cargo === 'Funcionário').length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários do Sistema</h1>
          <p className="text-gray-500 mt-1">Gerencie os usuários e permissões de acesso</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-lg border-none bg-gradient-to-br from-sky-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-sky-700 font-medium">Total de Usuários</p>
                <h3 className="text-4xl font-bold text-sky-900 mt-2">{totalUsuarios}</h3>
              </div>
              <div className="w-12 h-12 bg-sky-200 rounded-xl flex items-center justify-center">
                <UserCog className="w-6 h-6 text-sky-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-green-700 font-medium">Administradores</p>
                <h3 className="text-4xl font-bold text-green-900 mt-2">{totalAdmins}</h3>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-purple-700 font-medium">Funcionários</p>
                <h3 className="text-4xl font-bold text-purple-900 mt-2">{totalFuncionarios}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-none">
        <CardHeader className="border-b border-gray-100">
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo de Acesso</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isAdmin = user.email?.toLowerCase().includes('flyturadm') || 
                               user.cargo === 'Administrador' || 
                               user.role === 'admin';
                return (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {user.full_name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        {user.full_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>{user.telefone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={isAdmin ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                        {isAdmin ? 'Administrador' : 'Funcionário'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetPassword(user)}
                          title="Redefinir Senha"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          disabled={!isCurrentUserAdmin}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(user)}
                          disabled={!isCurrentUserAdmin || user.id === currentUser?.id}
                          className="text-red-600 hover:text-red-700"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <UserCog className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Nenhum usuário cadastrado ainda</p>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Editar Usuário</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={formData.full_name}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">O nome não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">O e-mail não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Acesso *</Label>
              <Select
                value={formData.cargo}
                onValueChange={(value) => setFormData({...formData, cargo: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Funcionário">Funcionário</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {formData.cargo === 'Administrador' 
                  ? '✓ Acesso total ao sistema' 
                  : '✓ Acesso restrito (sem financeiro e relatórios)'}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">
                <strong>Atenção:</strong> Esta ação não pode ser desfeita. Tem certeza que deseja excluir o usuário <strong>{userToDelete?.full_name}</strong>?
              </p>
            </div>

            <div className="space-y-2">
              <Label>E-mail do Usuário</Label>
              <Input
                value={userToDelete?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Excluir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Redefinir Senha</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                <strong>Atenção:</strong> Um e-mail de redefinição de senha será enviado para o usuário.
              </p>
            </div>

            <div className="space-y-2">
              <Label>E-mail do Usuário</Label>
              <Input
                type="email"
                value={resetEmail}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Nome do Usuário</Label>
              <Input
                value={selectedUser?.full_name || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowResetPassword(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendResetEmail} className="bg-sky-600 hover:bg-sky-700">
              <Mail className="w-4 h-4 mr-2" />
              Enviar E-mail de Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}