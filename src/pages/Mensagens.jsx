import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Mail, Phone, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors = {
  "Novo": "bg-blue-100 text-blue-700",
  "Em Atendimento": "bg-yellow-100 text-yellow-700",
  "Respondido": "bg-green-100 text-green-700"
};

export default function Mensagens() {
  const queryClient = useQueryClient();

  const { data: contatos = [] } = useQuery({
    queryKey: ['contatos'],
    queryFn: () => base44.entities.Contato.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Contato.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['contatos']);
    },
  });

  const handleStatusChange = (id, newStatus) => {
    updateMutation.mutate({ id, status: newStatus });
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mensagens de Contato</h1>
        <p className="text-gray-500 mt-1">Gerencie as mensagens recebidas pelo formulário do site</p>
      </div>

      <div className="grid gap-4">
        {contatos.map((contato) => (
          <Card key={contato.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
            <CardHeader className="border-b border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{contato.nome}</h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(contato.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={contato.status}
                    onValueChange={(value) => handleStatusChange(contato.id, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Em Atendimento">Em Atendimento</SelectItem>
                      <SelectItem value="Respondido">Respondido</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge className={statusColors[contato.status]}>
                    {contato.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-sky-600" />
                  <span className="font-medium">{contato.telefone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">{contato.email}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{contato.mensagem}</p>
              </div>
              <div className="flex gap-3 mt-4">
                <a href={`tel:${contato.telefone}`}>
                  <Button variant="outline" className="gap-2">
                    <Phone className="w-4 h-4" />
                    Ligar
                  </Button>
                </a>
                <a href={`mailto:${contato.email}`}>
                  <Button variant="outline" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Enviar E-mail
                  </Button>
                </a>
                {contato.status !== 'Respondido' && (
                  <Button
                    onClick={() => handleStatusChange(contato.id, 'Respondido')}
                    className="gap-2 bg-green-600 hover:bg-green-700 ml-auto"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar como Respondido
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contatos.length === 0 && (
        <Card className="shadow-lg border-none">
          <CardContent className="p-12 text-center text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Nenhuma mensagem recebida ainda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}