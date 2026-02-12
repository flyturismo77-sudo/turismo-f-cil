import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Loader2, CheckCircle, Upload } from 'lucide-react';

export default function Configuracoes() {
  const [formData, setFormData] = useState({
    nome_empresa: 'Fly Turismo',
    slogan: 'Seu próximo destino começa aqui',
    logo_url: '',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: '',
    instagram: '',
    facebook: '',
    sobre_nos: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const configs = await base44.entities.ConfiguracaoEmpresa.list();
      return configs[0];
    },
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data) => {
      if (config?.id) {
        return await base44.entities.ConfiguracaoEmpresa.update(config.id, data);
      } else {
        return await base44.entities.ConfiguracaoEmpresa.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['config']);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, logo_url: file_url });
    setUploadingLogo(false);
  };

  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState("");

  const handleMigrationAges = async () => {
    if (!confirm("ATENÇÃO: Isso irá recalcular a idade e classificação de TODOS os clientes do banco de dados. Deseja continuar?")) return;
    
    setMigrating(true);
    setMigrationStatus("Carregando dados...");
    
    try {
      const clientes = await base44.entities.Cliente.list();
      const viagens = await base44.entities.Viagem.list();
      
      let updatedCount = 0;
      let errorCount = 0;

      setMigrationStatus(`Processando ${clientes.length} clientes...`);

      for (const cliente of clientes) {
        try {
          let updates = {};
          let needsUpdate = false;

          // Lógica de Idade
          let novaIdade = null;
          if (cliente.data_nascimento) {
             const hoje = new Date();
             const nascimento = new Date(cliente.data_nascimento + 'T00:00:00');
             let idadeCalc = hoje.getFullYear() - nascimento.getFullYear();
             const mes = hoje.getMonth() - nascimento.getMonth();
             if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
               idadeCalc--;
             }
             novaIdade = idadeCalc;
          }

          // Se não tem data, idade DEVE ser null (Adulto)
          // Se tem data, idade calculada
          
          // Verificar se precisa atualizar idade
          // Se a idade atual é diferente da calculada (considerando null vs 0 etc)
          // Antes, sem data virava 0. Agora vira null.
          if (cliente.idade !== novaIdade) {
             // Se for undefined ou null e novaIdade for null, ok. Mas se idade era 0 e nova é null, update.
             if (cliente.idade !== undefined || novaIdade !== null) {
                updates.idade = novaIdade;
                needsUpdate = true;
             }
          }

          // Lógica de Preço (Pirapark)
          const viagem = viagens.find(v => v.id === cliente.id_viagem);
          if (viagem?.modo_pirapark) {
             let novoValor = 429.90; // Adulto Padrão
             
             if (novaIdade !== null) {
                if (novaIdade <= 5) {
                   novoValor = 0; // Isento
                } else if (novaIdade >= 6 && novaIdade <= 11) {
                   novoValor = 389.90; // Criança
                }
             }
             
             // Se o valor do pacote for diferente (e não for personalizado/manual override, difícil saber, 
             // mas a regra diz "Atualizar Financeiro". Vamos assumir que se for modo pirapark, o valor segue a regra)
             // Para evitar sobrescrever valores personalizados, podemos checar se o valor atual bate com alguma das faixas antigas
             // Ou apenas forçar a regra nova. O prompt diz "Atualizar... Financeiro". "Aplicar automaticamente as novas regras".
             // Vou forçar a regra.
             
             if (cliente.valor_total_pacote !== novoValor) {
                updates.valor_total_pacote = novoValor;
                needsUpdate = true;
             }
          }

          if (needsUpdate) {
            await base44.entities.Cliente.update(cliente.id, updates);
            updatedCount++;
          }
          
          // Atualizar status a cada 10
          if (updatedCount % 10 === 0) setMigrationStatus(`Processando... ${updatedCount} atualizados.`);

        } catch (err) {
          console.error(`Erro ao atualizar cliente ${cliente.nome_completo}:`, err);
          errorCount++;
        }
      }

      setMigrationStatus(`Concluído! ${updatedCount} clientes atualizados. ${errorCount} erros.`);
      alert(`Migração concluída!\n\nClientes processados: ${clientes.length}\nAtualizados: ${updatedCount}\nErros: ${errorCount}`);
      
    } catch (error) {
      console.error("Erro geral na migração:", error);
      setMigrationStatus("Erro ao processar migração.");
      alert("Erro ao realizar migração. Verifique o console.");
    } finally {
      setMigrating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createOrUpdateMutation.mutate(formData);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Personalize as informações da sua empresa</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">Configurações salvas com sucesso!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input
                  value={formData.nome_empresa}
                  onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })}
                  placeholder="Fly Turismo"
                />
              </div>
              <div className="space-y-2">
                <Label>Slogan</Label>
                <Input
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  placeholder="Seu próximo destino começa aqui"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo da Empresa</Label>
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {formData.logo_url && (
                  <div className="w-32 h-32 border-2 border-gray-200 rounded-lg p-2 flex items-center justify-center bg-white">
                    <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="mb-2"
                  />
                  {uploadingLogo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando logo...
                    </div>
                  )}
                  <p className="text-sm text-gray-500">Formatos aceitos: PNG, JPG, SVG</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sobre Nós</Label>
              <Textarea
                value={formData.sobre_nos}
                onChange={(e) => setFormData({ ...formData, sobre_nos: e.target.value })}
                rows={4}
                placeholder="Conte a história da sua empresa..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@flyturismo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Endereço Completo</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Rua, número, bairro, cidade - estado"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle>Redes Sociais</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="https://instagram.com/flyturismo"
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="https://facebook.com/flyturismo"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={createOrUpdateMutation.isPending}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 px-8"
            size="lg"
          >
            {createOrUpdateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </div>
      </form>

      <Card className="shadow-lg border-none border-t-4 border-t-red-500 mt-12">
        <CardHeader className="border-b border-gray-100 bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-800">
            ⚠️ Zona de Perigo - Correção de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Recalcular Idades e Classificações</h3>
              <p className="text-gray-600 mt-2 max-w-2xl">
                Esta ferramenta irá percorrer TODOS os clientes cadastrados e aplicar as novas regras de negócio:
                <br/>
                1. Sem data de nascimento = <strong>ADULTO</strong> (Idade removida)
                <br/>
                2. 0 a 5 anos = <strong>ISENTO / COLO</strong>
                <br/>
                3. 6 a 11 anos = <strong>CRIANÇA</strong>
                <br/>
                4. 12+ anos = <strong>ADULTO</strong>
                <br/>
                <span className="text-red-600 text-sm mt-1 block">
                  * Também recalculará valores de pacotes Pirapark conforme a nova idade.
                </span>
              </p>
              {migrationStatus && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg font-mono text-sm text-gray-700 border border-gray-200">
                  {migrationStatus}
                </div>
              )}
            </div>
            <Button 
              variant="destructive" 
              size="lg" 
              onClick={handleMigrationAges}
              disabled={migrating}
              className="whitespace-nowrap shadow-lg hover:shadow-xl transition-all"
            >
              {migrating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'EXECUTAR CORREÇÃO GERAL'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Temporary Import Section */}
      <Card className="shadow-lg border-none mt-6">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Dados (Base44)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ImportClientes />
        </CardContent>
      </Card>
    </div>
  );
}

function ImportClientes() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    try {
      const resp = await fetch('/data/clientes-import.json');
      const clientes = await resp.json();
      
      const edgeResp = await fetch(
        'https://duzfdwkjqqsayisfllww.supabase.co/functions/v1/import-clientes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1emZkd2tqcXFzYXlpc2ZsbHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzI4ODksImV4cCI6MjA4NjQwODg4OX0.DKdBuaeaPunvxh_gawqaDHva3nOI0Qcbvby6zMV_8PA',
          },
          body: JSON.stringify({ clientes }),
        }
      );
      const data = await edgeResp.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setImporting(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Clique para importar os clientes do arquivo JSON (Base44 → Supabase).
      </p>
      <Button onClick={handleImport} disabled={importing}>
        {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        {importing ? 'Importando...' : 'Importar Clientes'}
      </Button>
      {result && (
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}