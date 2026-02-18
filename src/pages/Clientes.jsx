import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Loader2, MessageSquare, CheckCircle, UserPlus, X } from "lucide-react";

const statusColors = {
  "Pago": "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  "Pendente": "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
  "Parcial": "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400"
};

export default function Clientes() {
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroSexo, setFiltroSexo] = useState("todos");
  const [filtroViagem, setFiltroViagem] = useState("all");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [acompanhantes, setAcompanhantes] = useState([]);
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    sexo: '',
    data_nascimento: '',
    idade: '',
    telefone: '',
    email: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    local_embarque: '',
    id_viagem: '',
    forma_pagamento: 'À Vista',
    numero_parcelas: 1,
    valor_selecionado: 'Valor 1',
    valor_personalizado: 0,
    e_crianca_colo: false,
    possui_crianca_colo: false,
    nome_crianca_colo: '',
    idade_crianca_colo: 0,
    status_pagamento: 'Pendente',
    valor_total_pacote: 0,
    valor_pago: 0,
    cor_grupo: '',
    observacoes: ''
  });

  const queryClient = useQueryClient();

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list("-created_date"),
  });

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: () => base44.entities.Viagem.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const cliente = await base44.entities.Cliente.create(data.clienteData);
      
      if (data.acompanhantes && data.acompanhantes.length > 0) {
        for (const acomp of data.acompanhantes) {
          await base44.entities.Cliente.create({
            ...acomp,
            id_cliente_principal: cliente.id,
            id_viagem: data.clienteData.id_viagem,
          });
        }
      }
      
      const viagem = viagens.find(v => v.id === data.clienteData.id_viagem);
      if (viagem) {
        const totalNovosPassageiros = 1 + (data.acompanhantes?.length || 0);
        await base44.entities.Viagem.update(viagem.id, {
          ...viagem,
          vagas_ocupadas: (viagem.vagas_ocupadas || 0) + totalNovosPassageiros
        });
      }
      
      return cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['viagens']);
      setShowForm(false);
      resetForm();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['viagens']);
      queryClient.invalidateQueries(['assentos']);
      setShowForm(false);
      resetForm();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cliente) => {
      await base44.entities.Cliente.delete(cliente.id);
      
      if (!cliente.id_cliente_principal) {
        const associatedAcompanhantes = clientes.filter(c => c.id_cliente_principal === cliente.id);
        for (const acomp of associatedAcompanhantes) {
          await base44.entities.Cliente.delete(acomp.id);
        }
      }

      const viagem = viagens.find(v => v.id === cliente.id_viagem);
      if (viagem && viagem.vagas_ocupadas > 0) {
        let countToDecrement = 1;
        if (!cliente.id_cliente_principal) {
          const associatedAcompanhantes = clientes.filter(c => c.id_cliente_principal === cliente.id);
          countToDecrement += associatedAcompanhantes.length;
        }
        
        await base44.entities.Viagem.update(viagem.id, {
          ...viagem,
          vagas_ocupadas: Math.max(0, viagem.vagas_ocupadas - countToDecrement)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['viagens']);
    },
  });

  const resetForm = () => {
    setFormData({
      nome_completo: '',
      cpf: '',
      sexo: '',
      data_nascimento: '',
      idade: 0,
      telefone: '',
      email: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      local_embarque: '',
      id_viagem: '',
      forma_pagamento: 'À Vista',
      numero_parcelas: 1,
      valor_selecionado: 'Valor 1',
      valor_personalizado: 0,
      e_crianca_colo: false,
      possui_crianca_colo: false,
      nome_crianca_colo: '',
      idade_crianca_colo: 0,
      status_pagamento: 'Pendente',
      valor_total_pacote: 0,
      valor_pago: 0,
      cor_grupo: '',
      numero_grupo: 1,
      observacoes: ''
    });
    setAcompanhantes([]);
    setEditingCliente(null);
  };

  const calculateAge = (dataNascimento) => {
    if (!dataNascimento) return null; // Return null for missing DOB
    const hoje = new Date();
    const nascimento = new Date(dataNascimento + 'T00:00:00');
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const calculateValorPirapark = (idade, id_viagem) => {
    const viagem = viagens.find(v => v.id === id_viagem);
    if (!viagem?.modo_pirapark) return 0;

    // NOVA REGRA:
    // Sem data (idade null) -> ADULTO
    // 0-5 -> ISENTO
    // 6-11 -> CRIANÇA
    // 12+ -> ADULTO

    if (idade === null || idade === undefined || idade === '') return 429.90; // Adulto (Sem data)
    
    if (idade <= 5) return 0; // Isento (0-5)
    else if (idade >= 6 && idade <= 11) return 389.90; // Criança (6-11)
    else return 429.90; // Adulto (12+)
  };

  const handleIdadeChange = (dataNascimento, isAcompanhante = false, index = null) => {
    const idade = calculateAge(dataNascimento);
    const id_viagem = isAcompanhante ? acompanhantes[index].id_viagem : formData.id_viagem;
    const valorPirapark = calculateValorPirapark(idade, id_viagem);

    if (isAcompanhante) {
      updateAcompanhante(index, 'data_nascimento', dataNascimento);
      updateAcompanhante(index, 'idade', idade);
      if (viagens.find(v => v.id === id_viagem)?.modo_pirapark) {
        updateAcompanhante(index, 'valor_total_pacote', valorPirapark);
      } else if (idade !== null && idade <= 5) {
        updateAcompanhante(index, 'valor_total_pacote', 0);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        data_nascimento: dataNascimento,
        idade,
        valor_total_pacote: viagens.find(v => v.id === id_viagem)?.modo_pirapark ? valorPirapark : prev.valor_total_pacote
      }));
    }
  };

  const handleViagemChange = (id_viagem, isAcompanhante = false, index = null) => {
    const viagem = viagens.find(v => v.id === id_viagem);
    let valorFinal = 0;
    let valorSelecionado = 'Valor 1';
    let idade = isAcompanhante ? calculateAge(acompanhantes[index].data_nascimento) : (formData.idade || 0);

    if (viagem?.modo_pirapark) {
      valorFinal = calculateValorPirapark(idade, id_viagem);
    } else {
      valorFinal = viagem?.valor_1 || 0;
      valorSelecionado = 'Valor 1';
    }

    if (isAcompanhante) {
      updateAcompanhante(index, 'id_viagem', id_viagem);
      updateAcompanhante(index, 'valor_selecionado', valorSelecionado);
      updateAcompanhante(index, 'valor_total_pacote', valorFinal);
    } else {
      setFormData(prev => ({
        ...prev,
        id_viagem,
        valor_selecionado: valorSelecionado,
        valor_total_pacote: valorFinal
      }));
    }
  };

  const handleValorSelecionadoChange = (valorSelecionado, isAcompanhante = false, index = null) => {
    const targetViagemId = isAcompanhante ? acompanhantes[index].id_viagem : formData.id_viagem;
    const viagem = viagens.find(v => v.id === targetViagemId);
    if (!viagem) return;
    
    let valorFinal = 0;
    if (valorSelecionado === 'Valor Personalizado') {
      valorFinal = isAcompanhante ? acompanhantes[index].valor_personalizado : formData.valor_personalizado;
    } else if (valorSelecionado === 'Valor 1') {
      valorFinal = viagem.valor_1 || 0;
    } else if (valorSelecionado === 'Valor 2') {
      valorFinal = viagem.valor_2 || 0;
    } else if (valorSelecionado === 'Valor 3') {
      valorFinal = viagem.valor_3 || 0;
    }

    if (isAcompanhante) {
      updateAcompanhante(index, 'valor_selecionado', valorSelecionado);
      updateAcompanhante(index, 'valor_total_pacote', valorFinal);
    } else {
      setFormData(prev => ({
        ...prev,
        valor_selecionado: valorSelecionado,
        valor_total_pacote: valorFinal
      }));
    }
  };

  const handleValorPersonalizadoChange = (valor, isAcompanhante = false, index = null) => {
    if (isAcompanhante) {
      updateAcompanhante(index, 'valor_personalizado', valor);
      if (acompanhantes[index].valor_selecionado === 'Valor Personalizado') {
        updateAcompanhante(index, 'valor_total_pacote', valor);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        valor_personalizado: valor,
        valor_total_pacote: formData.valor_selecionado === 'Valor Personalizado' ? valor : prev.valor_total_pacote
      }));
    }
  };

  const addAcompanhante = () => {
    setAcompanhantes([...acompanhantes, {
      nome_completo: '',
      cpf: '',
      telefone: '',
      data_nascimento: '',
      idade: '',
      sexo: '',
      id_viagem: formData.id_viagem || '',
      e_crianca_colo: false,
      forma_pagamento: 'À Vista',
      numero_parcelas: 1,
      valor_selecionado: 'Valor 1',
      valor_personalizado: 0,
      valor_total_pacote: 0,
      status_pagamento: 'Pendente',
    }]);
  };

  const removeAcompanhante = (index) => {
    setAcompanhantes(acompanhantes.filter((_, i) => i !== index));
  };

  const updateAcompanhante = (index, field, value) => {
    const updated = [...acompanhantes];
    updated[index] = { ...updated[index], [field]: value };
    setAcompanhantes(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Cliente sempre é criado SEM poltrona
    let finalFormData = { ...formData };
    
    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data: finalFormData });
    } else {
      const preparedAcompanhantes = acompanhantes.map(a => {
        let acompData = { ...a };
        
        const viagem = viagens.find(v => v.id === a.id_viagem);
        if (viagem?.modo_pirapark) {
          acompData.valor_total_pacote = calculateValorPirapark(acompData.idade, acompData.id_viagem);
        } else if (acompData.valor_selecionado === 'Valor Personalizado') {
          acompData.valor_total_pacote = acompData.valor_personalizado || 0;
        } else if (acompData.valor_selecionado === 'Valor 1') {
          acompData.valor_total_pacote = viagem?.valor_1 || 0;
        } else if (acompData.valor_selecionado === 'Valor 2') {
          acompData.valor_total_pacote = viagem?.valor_2 || 0;
        } else if (acompData.valor_selecionado === 'Valor 3') {
          acompData.valor_total_pacote = viagem?.valor_3 || 0;
        } else if (acompData.idade !== null && acompData.idade !== '' && acompData.idade <= 5) {
          acompData.valor_total_pacote = 0;
        }

        return acompData;
      });
      
      createMutation.mutate({ 
        clienteData: finalFormData, 
        acompanhantes: preparedAcompanhantes 
      });
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setAcompanhantes([]);

    setFormData({
      nome_completo: cliente.nome_completo || '',
      cpf: cliente.cpf || '',
      sexo: cliente.sexo || '',
      data_nascimento: cliente.data_nascimento ? cliente.data_nascimento.split('T')[0] : '',
      idade: cliente.idade || 0,
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      rua: cliente.rua || '',
      numero: cliente.numero || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      cep: cliente.cep || '',
      local_embarque: cliente.local_embarque || '',
      id_viagem: cliente.id_viagem || '',
      forma_pagamento: cliente.forma_pagamento || 'À Vista',
      numero_parcelas: cliente.numero_parcelas || 1,
      valor_selecionado: cliente.valor_selecionado || 'Valor 1',
      valor_personalizado: cliente.valor_personalizado || 0,
      e_crianca_colo: cliente.e_crianca_colo || false,
      possui_crianca_colo: cliente.possui_crianca_colo || false,
      nome_crianca_colo: cliente.nome_crianca_colo || '',
      idade_crianca_colo: cliente.idade_crianca_colo || 0,
      status_pagamento: cliente.status_pagamento || 'Pendente',
      valor_total_pacote: cliente.valor_total_pacote || 0,
      valor_pago: cliente.valor_pago || 0,
      cor_grupo: cliente.cor_grupo || '',
      numero_grupo: cliente.numero_grupo || 1,
      observacoes: cliente.observacoes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (cliente) => {
    if (confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome_completo}"?`)) {
      deleteMutation.mutate(cliente);
    }
  };

  const filteredClientes = clientes.filter(c => {
    const matchesSearch = c.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf?.includes(searchTerm) ||
      c.telefone?.includes(searchTerm);
    
    const isMainClientOrSearchedCompanion = !c.id_cliente_principal || 
                                           (searchTerm && (c.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm)));

    const matchesTipo = filtroTipo === "todos" ||
    (filtroTipo === "adulto" && (c.idade === undefined || c.idade === null || c.idade === '' || c.idade >= 12)) ||
    (filtroTipo === "crianca" && (c.idade !== undefined && c.idade !== null && c.idade !== '' && c.idade >= 6 && c.idade <= 11)) ||
    (filtroTipo === "isento" && (c.idade !== undefined && c.idade !== null && c.idade !== '' && c.idade <= 5));
    
    const matchesSexo = filtroSexo === "todos" || c.sexo === filtroSexo;
    const matchesViagem = filtroViagem === "all" || c.id_viagem === filtroViagem;
    
    return matchesSearch && matchesTipo && matchesSexo && matchesViagem && isMainClientOrSearchedCompanion;
  });

  const getViagemNome = (id_viagem) => {
    const viagem = viagens.find(v => v.id === id_viagem);
    return viagem ? viagem.nome : 'N/A';
  };

  const enviarWhatsApp = (cliente) => {
    const mensagem = `Olá ${cliente.nome_completo}! Aqui é da Fly Turismo. Como podemos ajudar?`;
    const cleanPhoneNumber = cliente.telefone?.replace(/\D/g, '') || '';
    const url = `https://wa.me/55${cleanPhoneNumber}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const getFaixaEtariaPirapark = (idade) => {
    // NOVA REGRA
    if (idade === null || idade === undefined || idade === '') return { label: 'Adulto (Sem data de nascimento)', color: 'bg-green-100 text-green-700' };
    if (idade <= 5) return { label: 'Isento (0-5 anos)', color: 'bg-blue-100 text-blue-700' };
    if (idade >= 6 && idade <= 11) return { label: 'Criança (6-11 anos)', color: 'bg-purple-100 text-purple-700' };
    return { label: 'Adulto (12+ anos)', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">✅ Cliente salvo! Atribua o assento no mapa.</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os clientes cadastrados</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroViagem} onValueChange={setFiltroViagem}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Filtrar por viagem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Viagens</SelectItem>
            {viagens.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="adulto">Adultos (12+ ou S/Data)</SelectItem>
            <SelectItem value="crianca">Crianças (6-11 anos)</SelectItem>
            <SelectItem value="isento">Isentos (0-5 anos)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroSexo} onValueChange={setFiltroSexo}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por sexo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Masculino">Masculino</SelectItem>
            <SelectItem value="Feminino">Feminino</SelectItem>
            <SelectItem value="Outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Viagem</TableHead>
              <TableHead>Local Embarque</TableHead>
              <TableHead>Poltrona</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClientes.map((cliente) => {
              const viagem = viagens.find(v => v.id === cliente.id_viagem);
              const isPirapark = viagem?.modo_pirapark;
              const isCriancaIsenta = !isPirapark && cliente.idade !== undefined && cliente.idade !== null && cliente.idade <= 5 && !cliente.e_crianca_colo;
              const valorFinal = cliente.valor_total_pacote;
              return (
                <TableRow key={cliente.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {cliente.nome_completo}
                      {isCriancaIsenta && (
                        <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs">
                          Criança (Isento)
                        </Badge>
                      )}
                      {cliente.e_crianca_colo && (
                        <Badge className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-xs">
                          Colo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{cliente.cpf}</TableCell>
                  <TableCell>{cliente.sexo || '-'}</TableCell>
                  <TableCell>
                    {cliente.idade !== undefined && cliente.idade !== null ? `${cliente.idade} anos` : '-'}
                  </TableCell>
                  <TableCell>{cliente.telefone}</TableCell>
                  <TableCell>{getViagemNome(cliente.id_viagem)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cliente.local_embarque || '-'}
                  </TableCell>
                  <TableCell>
                    {cliente.e_crianca_colo ? (
                      <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20">
                        Sem assento
                      </Badge>
                    ) : cliente.poltrona ? (
                      <div>
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">#{cliente.poltrona}</Badge>
                        {cliente.andar_onibus && (
                          <p className="text-xs text-muted-foreground mt-1">{cliente.andar_onibus}</p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                        Sem assento
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">R$ {valorFinal.toFixed(2)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[cliente.status_pagamento]}>
                      {cliente.status_pagamento}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => enviarWhatsApp(cliente)}
                        className="text-green-600 hover:text-green-700"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(cliente)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cliente)}
                        className="text-red-600 hover:text-red-700"
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
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum cliente encontrado
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingCliente ? '✏️ Editar Cliente' : '➕ Novo Cliente'}
            </DialogTitle>
            {!editingCliente && (
              <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                ℹ️ O assento será atribuído posteriormente no <strong>Mapa de Assentos</strong>
              </p>
            )}
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label>CPF *</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sexo *</Label>
                <Select value={formData.sexo} onValueChange={(value) => setFormData({...formData, sexo: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => handleIdadeChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Idade</Label>
                <Input
                  type="number"
                  value={formData.idade}
                  disabled
                  className="bg-gray-50"
                  placeholder="Auto"
                />
              </div>
            </div>

            {(() => {
              const viagem = viagens.find(v => v.id === formData.id_viagem);
              const isPirapark = viagem?.modo_pirapark;
              const idade = formData.idade || 0;
              
              if (isPirapark) {
                const faixa = getFaixaEtariaPirapark(idade);
                return (
                  <div className={`${faixa.color} border-2 rounded-lg p-4`}>
                    <p className="font-bold text-sm flex items-center gap-2">
                      <span>🎢</span>
                      <span>MODO PIRAPARK ATIVO</span>
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Faixa detectada:</strong> <span className="font-semibold">{faixa.label}</span>
                    </p>
                    <p className="text-sm mt-1">
                      <strong>Valor automático:</strong> R$ {formData.valor_total_pacote.toFixed(2)}
                    </p>
                  </div>
                );
              } else if (formData.idade !== null && formData.idade !== '' && formData.idade <= 5 && !isPirapark) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 font-medium text-sm">
                      ⚠️ Cliente ISENTO (0-5 anos). Valor do pacote será R$ 0,00.
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  placeholder="(00) 00000-0000"
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

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4 text-foreground">Endereço</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Rua</Label>
                  <Input
                    value={formData.rua}
                    onChange={(e) => setFormData({...formData, rua: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formData.cep}
                    onChange={(e) => setFormData({...formData, cep: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Local de Embarque</Label>
              <Input
                value={formData.local_embarque}
                onChange={(e) => setFormData({...formData, local_embarque: e.target.value})}
                placeholder="Ex: Marcely - Lontra/MG"
              />
            </div>

            <div className="space-y-2">
              <Label>Viagem *</Label>
              <Select
                value={formData.id_viagem}
                onValueChange={handleViagemChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {viagens.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nome} {v.modo_pirapark ? '🎢' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="e_crianca_colo_main"
                checked={formData.e_crianca_colo}
                onChange={(e) => setFormData({...formData, e_crianca_colo: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="e_crianca_colo_main" className="cursor-pointer">
                Este cliente é uma criança de colo (não ocupa assento)?
              </Label>
            </div>

            {!viagens.find(v => v.id === formData.id_viagem)?.modo_pirapark && formData.id_viagem && (
              <div className="border-2 border-sky-200 bg-sky-50 rounded-lg p-4">
                <Label className="font-semibold text-sky-900 mb-3 block">
                  Selecionar valor para este cliente
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {['Valor 1', 'Valor 2', 'Valor 3', 'Valor Personalizado'].map((opcao) => {
                    const viagem = viagens.find(v => v.id === formData.id_viagem);
                    let valor = 0;
                    let colorClass = 'border-gray-200 hover:border-sky-300';
                    
                    if (opcao === 'Valor 1') {
                      valor = viagem?.valor_1 || 0;
                      if (formData.valor_selecionado === opcao) colorClass = 'border-green-500 bg-green-50';
                    } else if (opcao === 'Valor 2') {
                      valor = viagem?.valor_2 || 0;
                      if (formData.valor_selecionado === opcao) colorClass = 'border-sky-500 bg-sky-50';
                    } else if (opcao === 'Valor 3') {
                      valor = viagem?.valor_3 || 0;
                      if (formData.valor_selecionado === opcao) colorClass = 'border-amber-500 bg-amber-50';
                    } else {
                      if (formData.valor_selecionado === opcao) colorClass = 'border-purple-500 bg-purple-50';
                    }
                    
                    return (
                      <button
                        key={opcao}
                        type="button"
                        onClick={() => handleValorSelecionadoChange(opcao)}
                        className={`p-3 border-2 rounded-lg transition-all ${colorClass}`}
                      >
                        <p className="text-xs text-gray-600 mb-1">
                          {opcao === 'Valor 1' && '1️⃣ '}
                          {opcao === 'Valor 2' && '2️⃣ '}
                          {opcao === 'Valor 3' && '3️⃣ '}
                          {opcao === 'Valor Personalizado' && '💸 '}
                          {opcao}
                        </p>
                        {opcao !== 'Valor Personalizado' && (
                          <p className="text-sm font-bold text-gray-900">
                            R$ {valor.toFixed(2)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {formData.valor_selecionado === 'Valor Personalizado' && (
                  <div className="mt-4">
                    <Label>Digite o valor personalizado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.valor_personalizado}
                      onChange={(e) => handleValorPersonalizadoChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="mt-2"
                    />
                  </div>
                )}
                
                <p className="text-xs text-sky-700 mt-3">
                  ✅ Valor selecionado: <strong>{formData.valor_selecionado}</strong> - R$ {formData.valor_total_pacote.toFixed(2)}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select 
                  value={formData.forma_pagamento} 
                  onValueChange={(value) => setFormData({...formData, forma_pagamento: value, numero_parcelas: value === 'À Vista' ? 1 : formData.numero_parcelas})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="À Vista">À Vista</SelectItem>
                    <SelectItem value="Parcelado">Parcelado</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.forma_pagamento === 'Parcelado' || formData.forma_pagamento === 'Boleto') && (
                <div className="space-y-2">
                  <Label>Número de Parcelas</Label>
                  <Select 
                    value={formData.numero_parcelas.toString()} 
                    onValueChange={(value) => setFormData({...formData, numero_parcelas: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}x {formData.forma_pagamento === 'Boleto' ? '(Boleto)' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {!editingCliente && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 text-foreground flex items-center justify-between">
                  Acompanhantes
                  <Button type="button" variant="outline" size="sm" onClick={addAcompanhante} disabled={!formData.id_viagem}>
                    <UserPlus className="w-4 h-4 mr-2" /> Adicionar Acompanhante
                  </Button>
                </h3>
                {acompanhantes.length === 0 && (
                  <p className="text-muted-foreground text-sm italic">Adicione acompanhantes para esta viagem (opcional).</p>
                )}
                <div className="space-y-6">
                  {acompanhantes.map((acompanhante, index) => {
                    const acompanhanteViagem = viagens.find(v => v.id === acompanhante.id_viagem);
                    const isPiraparkAcomp = acompanhanteViagem?.modo_pirapark;
                    const idadeAcomp = acompanhante.idade || 0;
                    return (
                      <div key={index} className="border border-border p-4 rounded-lg bg-muted/30 relative">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 text-red-500 hover:bg-red-100" 
                          onClick={() => removeAcompanhante(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <h4 className="font-medium text-lg mb-3">Acompanhante #{index + 1}</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nome Completo</Label>
                            <Input
                              value={acompanhante.nome_completo}
                              onChange={(e) => updateAcompanhante(index, 'nome_completo', e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>CPF</Label>
                            <Input
                              value={acompanhante.cpf}
                              onChange={(e) => updateAcompanhante(index, 'cpf', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label>Sexo</Label>
                            <Select value={acompanhante.sexo} onValueChange={(value) => updateAcompanhante(index, 'sexo', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Feminino">Feminino</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Data de Nascimento</Label>
                            <Input
                              type="date"
                              value={acompanhante.data_nascimento}
                              onChange={(e) => handleIdadeChange(e.target.value, true, index)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Idade</Label>
                            <Input
                              type="number"
                              value={acompanhante.idade}
                              disabled
                              className="bg-gray-100"
                              placeholder="Auto"
                            />
                          </div>
                        </div>

                        {isPiraparkAcomp && idadeAcomp > 0 ? (
                          <div className={`${getFaixaEtariaPirapark(idadeAcomp).color} border-2 rounded-lg p-4 mt-4`}>
                            <p className="font-bold text-sm flex items-center gap-2">
                              <span>🎢</span>
                              <span>MODO PIRAPARK ATIVO</span>
                            </p>
                            <p className="text-sm mt-2">
                              <strong>Faixa detectada:</strong> <span className="font-semibold">{getFaixaEtariaPirapark(idadeAcomp).label}</span>
                            </p>
                            <p className="text-sm mt-1">
                              <strong>Valor automático:</strong> R$ {acompanhante.valor_total_pacote.toFixed(2)}
                            </p>
                          </div>
                        ) : (acompanhante.idade !== null && acompanhante.idade !== '' && acompanhante.idade <= 5 && !isPiraparkAcomp && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                            <p className="text-red-700 font-medium text-sm">
                              ⚠️ Acompanhante ISENTO (0-5 anos). Valor do pacote será R$ 0,00.
                            </p>
                          </div>
                        ))}

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label>Telefone</Label>
                            <Input
                              value={acompanhante.telefone}
                              onChange={(e) => updateAcompanhante(index, 'telefone', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Viagem</Label>
                            <Select
                              value={acompanhante.id_viagem}
                              onValueChange={(value) => handleViagemChange(value, true, index)}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {viagens.map(v => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.nome} {v.modo_pirapark ? '🎢' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                          <input
                            type="checkbox"
                            id={`e_crianca_colo_acomp_${index}`}
                            checked={acompanhante.e_crianca_colo}
                            onChange={(e) => updateAcompanhante(index, 'e_crianca_colo', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`e_crianca_colo_acomp_${index}`} className="cursor-pointer">
                            Acompanhante é criança de colo?
                          </Label>
                        </div>
                        
                        {!acompanhanteViagem?.modo_pirapark && acompanhante.id_viagem && (
                          <div className="border-2 border-sky-200 bg-sky-50 rounded-lg p-4 mt-4">
                            <Label className="font-semibold text-sky-900 mb-3 block">
                              Selecionar valor para este acompanhante
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              {['Valor 1', 'Valor 2', 'Valor 3', 'Valor Personalizado'].map((opcao) => {
                                const acompViagem = viagens.find(v => v.id === acompanhante.id_viagem);
                                let valor = 0;
                                let colorClass = 'border-gray-200 hover:border-sky-300';
                                
                                if (opcao === 'Valor 1') {
                                  valor = acompViagem?.valor_1 || 0;
                                  if (acompanhante.valor_selecionado === opcao) colorClass = 'border-green-500 bg-green-50';
                                } else if (opcao === 'Valor 2') {
                                  valor = acompViagem?.valor_2 || 0;
                                  if (acompanhante.valor_selecionado === opcao) colorClass = 'border-sky-500 bg-sky-50';
                                } else if (opcao === 'Valor 3') {
                                  valor = acompViagem?.valor_3 || 0;
                                  if (acompanhante.valor_selecionado === opcao) colorClass = 'border-amber-500 bg-amber-50';
                                } else {
                                  if (acompanhante.valor_selecionado === opcao) colorClass = 'border-purple-500 bg-purple-50';
                                }
                                
                                return (
                                  <button
                                    key={opcao}
                                    type="button"
                                    onClick={() => handleValorSelecionadoChange(opcao, true, index)}
                                    className={`p-3 border-2 rounded-lg transition-all ${colorClass}`}
                                  >
                                    <p className="text-xs text-gray-600 mb-1">
                                      {opcao === 'Valor 1' && '1️⃣ '}
                                      {opcao === 'Valor 2' && '2️⃣ '}
                                      {opcao === 'Valor 3' && '3️⃣ '}
                                      {opcao === 'Valor Personalizado' && '💸 '}
                                      {opcao}
                                    </p>
                                    {opcao !== 'Valor Personalizado' && (
                                      <p className="text-sm font-bold text-gray-900">
                                        R$ {valor.toFixed(2)}
                                      </p>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            
                            {acompanhante.valor_selecionado === 'Valor Personalizado' && (
                              <div className="mt-4">
                                <Label>Digite o valor personalizado (R$)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={acompanhante.valor_personalizado}
                                  onChange={(e) => handleValorPersonalizadoChange(parseFloat(e.target.value) || 0, true, index)}
                                  placeholder="0.00"
                                  className="mt-2"
                                />
                              </div>
                            )}
                            
                            <p className="text-xs text-sky-700 mt-3">
                              ✅ Valor selecionado: <strong>{acompanhante.valor_selecionado}</strong> - R$ {acompanhante.valor_total_pacote.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="possui_crianca_colo"
                  checked={formData.possui_crianca_colo}
                  onChange={(e) => setFormData({...formData, possui_crianca_colo: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label htmlFor="possui_crianca_colo" className="cursor-pointer">
                  Possui criança de colo acompanhante?
                </Label>
              </div>
              {formData.possui_crianca_colo && (
                <div className="grid md:grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label>Nome da Criança</Label>
                    <Input
                      value={formData.nome_crianca_colo}
                      onChange={(e) => setFormData({...formData, nome_crianca_colo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Idade da Criança</Label>
                    <Input
                      type="number"
                      value={formData.idade_crianca_colo}
                      onChange={(e) => setFormData({...formData, idade_crianca_colo: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valor Total Pacote (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_total_pacote}
                  onChange={(e) => setFormData({...formData, valor_total_pacote: parseFloat(e.target.value) || 0})}
                  disabled={(() => {
                    const viagem = viagens.find(v => v.id === formData.id_viagem);
                    const isPirapark = viagem?.modo_pirapark;
                    const isCriancaIsenta = !isPirapark && formData.idade > 0 && formData.idade <= 5 && !formData.e_crianca_colo;
                    const isValueSelectedAuto = formData.valor_selecionado !== 'Valor Personalizado';
                    return isPirapark || isCriancaIsenta || (formData.id_viagem && isValueSelectedAuto) || formData.e_crianca_colo;
                  })()}
                  className={(() => {
                    const viagem = viagens.find(v => v.id === formData.id_viagem);
                    const isPirapark = viagem?.modo_pirapark;
                    const isCriancaIsenta = !isPirapark && formData.idade > 0 && formData.idade <= 5 && !formData.e_crianca_colo;
                    const isValueSelectedAuto = formData.valor_selecionado !== 'Valor Personalizado';
                    return (isPirapark || isCriancaIsenta || (formData.id_viagem && isValueSelectedAuto) || formData.e_crianca_colo) ? "bg-gray-50" : "";
                  })()}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Pago (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_pago}
                  onChange={(e) => setFormData({...formData, valor_pago: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Status Pagamento</Label>
                <Select
                  value={formData.status_pagamento}
                  onValueChange={(value) => setFormData({...formData, status_pagamento: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Parcial">Parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor do Grupo/Família (opcional)</Label>
              <p className="text-xs text-gray-500 mb-2">Identifique grupos ou famílias com cores</p>
              <Select 
                value={formData.cor_grupo} 
                onValueChange={(value) => setFormData({...formData, cor_grupo: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Sem cor</SelectItem>
                  <SelectItem value="vermelho">🔴 Vermelho</SelectItem>
                  <SelectItem value="azul">🔵 Azul</SelectItem>
                  <SelectItem value="verde">🟢 Verde</SelectItem>
                  <SelectItem value="amarelo">🟡 Amarelo</SelectItem>
                  <SelectItem value="roxo">🟣 Roxo</SelectItem>
                  <SelectItem value="rosa">🩷 Rosa</SelectItem>
                  <SelectItem value="laranja">🟠 Laranja</SelectItem>
                  <SelectItem value="marrom">🟤 Marrom</SelectItem>
                  <SelectItem value="cinza">⚫ Cinza</SelectItem>
                </SelectContent>
              </Select>
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
                {editingCliente ? '💾 Salvar' : 'Criar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}