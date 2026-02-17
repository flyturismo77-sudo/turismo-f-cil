import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Users, CheckCircle, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';

const statusColors = {
  "Pendente": "bg-yellow-100 text-yellow-700",
  "Recebido": "bg-blue-100 text-blue-700",
  "Processado": "bg-green-100 text-green-700"
};

export default function Formularios() {
  const queryClient = useQueryClient();

  const { data: formularios = [] } = useQuery({
    queryKey: ['formularios'],
    queryFn: () => base44.entities.FormularioContrato.list('-created_date'),
  });

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: () => base44.entities.Viagem.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.FormularioContrato.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['formularios']);
    },
  });

  const processarFormularioMutation = useMutation({
    mutationFn: async (formulario) => {
      // 1. Criar o cliente no banco principal
      const viagemSelecionada = viagens.find(v => v.id === formulario.id_viagem);
      const valorFinal = viagemSelecionada?.valor_total || 0;

      const clienteData = {
        nome_completo: formulario.nome_completo,
        cpf: formulario.cpf,
        rg: formulario.rg,
        sexo: formulario.sexo,
        data_nascimento: formulario.data_nascimento,
        telefone: formulario.telefone,
        email: formulario.email,
        rua: formulario.rua,
        numero: formulario.numero,
        bairro: formulario.bairro,
        cidade: formulario.cidade,
        id_viagem: formulario.id_viagem,
        forma_pagamento: formulario.forma_pagamento,
        numero_parcelas: formulario.numero_parcelas,
        possui_crianca_colo: formulario.possui_crianca_colo,
        nome_crianca_colo: formulario.nome_crianca_colo,
        idade_crianca_colo: formulario.idade_crianca_colo,
        status_pagamento: 'Pendente',
        valor_total_pacote: valorFinal - (formulario.desconto || 0),
        valor_pago: 0
      };

      await base44.entities.Cliente.create(clienteData);

      // 2. Atualizar vagas da viagem
      if (viagemSelecionada) {
        await base44.entities.Viagem.update(viagemSelecionada.id, {
          ...viagemSelecionada,
          vagas_ocupadas: (viagemSelecionada.vagas_ocupadas || 0) + 1
        });
      }

      // 3. Marcar formulário como processado
      await base44.entities.FormularioContrato.update(formulario.id, { 
        status: 'Processado' 
      });

      return formulario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['formularios']);
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['viagens']);
    },
  });

  const handleStatusChange = (id, newStatus) => {
    updateMutation.mutate({ id, status: newStatus });
  };

  const handleProcessarFormulario = async (formulario) => {
    if (formulario.status === 'Processado') {
      alert('Este formulário já foi processado!');
      return;
    }

    if (confirm(`Deseja processar o formulário de "${formulario.nome_completo}"?\n\nIsso irá:\n- Criar o cliente no sistema\n- Vincular à viagem\n- Atualizar as vagas\n- Marcar como processado`)) {
      await processarFormularioMutation.mutateAsync(formulario);
      alert('✅ Formulário processado com sucesso!\n\nDados sincronizados com o sistema.');
    }
  };

  const getViagemNome = (id) => {
    const viagem = viagens.find(v => v.id === id);
    return viagem ? viagem.nome : 'N/A';
  };

  const linkFormulario = `${window.location.origin}/InscricaoViagem`;

  const copiarLink = () => {
    navigator.clipboard.writeText(linkFormulario);
    alert('✅ Link copiado para a área de transferência!');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Formulários de Contrato</h1>
        <p className="text-gray-500 mt-1">Gerencie os formulários recebidos dos clientes</p>
      </div>

      <Card className="shadow-lg border-none bg-gradient-to-br from-sky-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">Link do Formulário Público</h3>
              <p className="text-sm text-gray-600 mb-3">
                Compartilhe este link com seus clientes para que eles preencham o formulário de contrato
              </p>
              <div className="flex gap-2">
                <Input
                  value={linkFormulario}
                  readOnly
                  className="bg-white"
                />
                <Button onClick={copiarLink} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
                <Button onClick={() => window.open(linkFormulario, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {formularios.map((form) => (
          <Card key={form.id} className="shadow-lg border-none hover:shadow-xl transition-shadow">
            <CardHeader className="border-b border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{form.nome_completo}</h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(form.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Viagem: <span className="font-medium">{getViagemNome(form.id_viagem)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={form.status}
                    onValueChange={(value) => handleStatusChange(form.id, value)}
                    disabled={form.status === 'Processado'}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Recebido">Recebido</SelectItem>
                      <SelectItem value="Processado">Processado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge className={statusColors[form.status]}>
                    {form.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Dados do Contratante</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">CPF:</span> <span className="font-medium">{form.cpf}</span></p>
                    <p><span className="text-gray-600">RG:</span> <span className="font-medium">{form.rg}</span></p>
                    <p><span className="text-gray-600">Sexo:</span> <span className="font-medium">{form.sexo}</span></p>
                    <p><span className="text-gray-600">Telefone:</span> <span className="font-medium">{form.telefone}</span></p>
                    <p><span className="text-gray-600">E-mail:</span> <span className="font-medium">{form.email}</span></p>
                    <p><span className="text-gray-600">Endereço:</span> <span className="font-medium">{form.rua}, {form.numero} - {form.bairro}, {form.cidade}</span></p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Informações de Pagamento</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Forma:</span> <span className="font-medium">{form.forma_pagamento}</span></p>
                    {form.forma_pagamento === 'Parcelado' && (
                      <p><span className="text-gray-600">Parcelas:</span> <span className="font-medium">{form.numero_parcelas}x</span></p>
                    )}
                    {form.desconto > 0 && (
                      <p><span className="text-gray-600">Desconto:</span> <span className="font-medium text-green-600">R$ {form.desconto.toFixed(2)}</span></p>
                    )}
                    {form.possui_crianca_colo && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="font-medium text-blue-900">Criança de colo:</p>
                        <p className="text-blue-700">{form.nome_crianca_colo} - {form.idade_crianca_colo} anos</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {form.passageiros && form.passageiros.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Passageiros Adicionais ({form.passageiros.length})
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {form.passageiros.map((p, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900">{p.nome_completo}</p>
                        <p className="text-sm text-gray-600">CPF: {p.cpf}</p>
                        {p.telefone && <p className="text-sm text-gray-600">Tel: {p.telefone}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.status !== 'Processado' && (
                <Button
                  onClick={() => handleProcessarFormulario(form)}
                  disabled={processarFormularioMutation.isPending}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {processarFormularioMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Marcar como Processado
                    </>
                  )}
                </Button>
              )}

              {form.status === 'Processado' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Formulário processado e sincronizado com o sistema
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {formularios.length === 0 && (
        <Card className="shadow-lg border-none">
          <CardContent className="p-12 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Nenhum formulário recebido ainda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}