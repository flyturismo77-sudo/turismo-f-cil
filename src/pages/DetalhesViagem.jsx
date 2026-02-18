import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Calendar, Users, Bus, Loader2, Armchair, UserPlus, Printer, CheckCircle, Search, Trash2, Pencil, Save, FileText, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { Link, useLocation } from "react-router-dom";

export default function DetalhesViagem() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const viagemId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [showClienteForm, setShowClienteForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Removed showMapaAssentos and selectedPoltrona states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    telefone: '',
    local_embarque: '',
    forma_pagamento: 'À Vista',
    numero_parcelas: 1,
    valor_selecionado: 'Valor 1',
    valor_personalizado: 0,
    valor_total_pacote: 0,
    valor_pago: 0,
    status_pagamento: 'Pendente',
    sexo: 'Masculino',
    data_nascimento: '',
    idade: '',
    e_crianca_colo: false,
    cor_grupo: '',
    numero_grupo: 1
    });

  const { data: viagem } = useQuery({
    queryKey: ['viagem', viagemId],
    queryFn: async () => {
      const viagens = await base44.entities.Viagem.list();
      return viagens.find(item => item.id === viagemId);
    },
    enabled: !!viagemId,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-viagem', viagemId],
    queryFn: () => base44.entities.Cliente.filter({ id_viagem: viagemId }),
    enabled: !!viagemId,
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos-viagem', viagemId],
    queryFn: () => base44.entities.DocumentoViagem.filter({ id_viagem: viagemId }),
    enabled: !!viagemId,
  });

  const saveDocumentMutation = useMutation({
    mutationFn: (docData) => base44.entities.DocumentoViagem.create(docData),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentos-viagem']);
      alert("Documento salvo com sucesso!");
    },
  });

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const configs = await base44.entities.ConfiguracaoEmpresa.list();
      return configs[0] || null;
    },
  });

  const createClienteMutation = useMutation({
    mutationFn: async (data) => {
      // Cliente criado SEM poltrona - será atribuída no mapa
      const cliente = await base44.entities.Cliente.create(data);
      
      if (viagem && !data.e_crianca_colo) { // Increment vagas_ocupadas only if not a lap child
        await base44.entities.Viagem.update(viagem.id, {
          vagas_ocupadas: (viagem.vagas_ocupadas || 0) + 1
        });
      }
      
      return cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes-viagem']);
      queryClient.invalidateQueries(['viagem']);
      queryClient.invalidateQueries(['clientes']);
      setShowClienteForm(false);
      resetForm();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    },
  });

  const removeClienteMutation = useMutation({
    mutationFn: async (cliente) => {
      if (window.confirm("Tem certeza que deseja excluir este cliente da viagem? Esta ação não pode ser desfeita.")) {
        // Remover vínculo com a viagem e limpar assento
        await base44.entities.Cliente.update(cliente.id, {
          id_viagem: null,
          poltrona: null,
          andar_onibus: null,
          // Mantemos o cliente no banco, apenas tiramos da viagem
        });

        // Atualizar vagas ocupadas se não for criança de colo
        if (!cliente.e_crianca_colo && viagem) {
          // Recarregar viagem para ter valor atualizado
          const currentViagemList = await base44.entities.Viagem.list();
          const currentViagem = currentViagemList.find(v => v.id === viagem.id);
          if (currentViagem) {
            await base44.entities.Viagem.update(viagem.id, {
              vagas_ocupadas: Math.max(0, (currentViagem.vagas_ocupadas || 0) - 1)
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes-viagem']);
      queryClient.invalidateQueries(['viagem']);
      queryClient.invalidateQueries(['clientes']);
    },
  });

  const updateClienteMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.Cliente.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes-viagem']);
      queryClient.invalidateQueries(['viagem']);
      queryClient.invalidateQueries(['clientes']);
      setShowClienteForm(false);
      resetForm();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    },
  });

  const resetForm = () => {
    const isPirapark = viagem?.modo_pirapark;
    const valorPadrao = isPirapark ? 429.90 : (viagem?.valor_1 || 0);
    
    setFormData({
      nome_completo: '',
      cpf: '',
      telefone: '',
      local_embarque: '',
      forma_pagamento: 'À Vista',
      numero_parcelas: 1,
      // Removed poltrona and andar_onibus from formData
      valor_selecionado: 'Valor 1',
      valor_personalizado: 0,
      valor_total_pacote: valorPadrao,
      valor_pago: 0,
      status_pagamento: 'Pendente',
      sexo: 'Masculino',
      data_nascimento: '',
      idade: '',
      e_crianca_colo: false,
      cor_grupo: '',
      numero_grupo: 1,
      observacoes: ''
      });
    setEditingCliente(null);
    // Removed setSelectedPoltrona(null);
  };

  const handleEditCliente = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome_completo: cliente.nome_completo || '',
      cpf: cliente.cpf || '',
      telefone: cliente.telefone || '',
      local_embarque: cliente.local_embarque || '',
      forma_pagamento: cliente.forma_pagamento || 'À Vista',
      numero_parcelas: cliente.numero_parcelas || 1,
      valor_selecionado: cliente.valor_selecionado || 'Valor 1',
      valor_personalizado: cliente.valor_personalizado || 0,
      valor_total_pacote: cliente.valor_total_pacote || 0,
      valor_pago: cliente.valor_pago || 0,
      status_pagamento: cliente.status_pagamento || 'Pendente',
      sexo: cliente.sexo || 'Masculino',
      data_nascimento: cliente.data_nascimento || '',
      idade: cliente.idade || 0,
      e_crianca_colo: cliente.e_crianca_colo || false,
      cor_grupo: cliente.cor_grupo || '',
      numero_grupo: cliente.numero_grupo || 1,
      observacoes: cliente.observacoes || ''
      });
    setShowClienteForm(true);
  };

  // Removed handleSelecionarPoltrona
  // Removed handlePoltronaClick
  // Removed renderMapaAssentos

  const handleIdadeChange = (dataNascimento) => {
    if (!dataNascimento) {
      setFormData(prev => ({ ...prev, data_nascimento: '', idade: '' }));
      return;
    }
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento + 'T00:00:00');
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    if (viagem?.modo_pirapark) {
      let valorCalculado = 429.90; // Adulto (padrão)
      if (idade !== '' && idade <= 4) {
        valorCalculado = 0; // Isento
      } else if (idade !== '' && idade >= 5 && idade <= 11) {
        valorCalculado = 389.90; // Infantil
      }
      
      setFormData(prev => ({
        ...prev,
        data_nascimento: dataNascimento,
        idade,
        valor_total_pacote: valorCalculado
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        data_nascimento: dataNascimento,
        idade,
      }));
    }
  };

  const handleValorSelecionadoChange = (valorSelecionado) => {
    if (!viagem) return;
    
    if (valorSelecionado === 'Valor Personalizado') {
      setFormData(prev => ({
        ...prev,
        valor_selecionado: valorSelecionado,
        valor_total_pacote: prev.valor_personalizado || 0
      }));
    } else {
      let valorFinal = 0;
      if (valorSelecionado === 'Valor 1') {
        valorFinal = viagem.valor_1 || 0;
      } else if (valorSelecionado === 'Valor 2') {
        valorFinal = viagem.valor_2 || 0;
      } else if (valorSelecionado === 'Valor 3') {
        valorFinal = viagem.valor_3 || 0;
      }
      
      setFormData(prev => ({
        ...prev,
        valor_selecionado: valorSelecionado,
        valor_total_pacote: valorFinal
      }));
    }
  };

  const handleValorPersonalizadoChange = (valor) => {
    setFormData(prev => ({
      ...prev,
      valor_personalizado: valor,
      valor_total_pacote: valor
    }));
  };

  const getFaixaEtariaPirapark = (idade) => {
    // NOVA REGRA
    if (idade === null || idade === undefined || idade === '') return { label: 'Adulto (Sem data de nascimento)', color: 'bg-green-100 text-green-700' };
    if (idade <= 5) return { label: 'Isento (0-5 anos)', color: 'bg-blue-100 text-blue-700' };
    if (idade >= 6 && idade <= 11) return { label: 'Criança (6-11 anos)', color: 'bg-purple-100 text-purple-700' };
    return { label: 'Adulto (12+ anos)', color: 'bg-green-100 text-green-700' };
  };

  const handleSubmitCliente = (e) => {
    e.preventDefault();
    
    // Cliente criado SEM poltrona - será atribuída no mapa de assentos
    // poltrona and andar_onibus are no longer part of formData for initial client creation
    let finalData = { ...formData, id_viagem: viagemId };
    
    if (editingCliente) {
      updateClienteMutation.mutate({ id: editingCliente.id, data: finalData });
    } else {
      createClienteMutation.mutate(finalData);
    }
  };

  const generateDocumentHTML = () => {
    if (!viagem) return "";
    
    const hoje = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const logoSection = config?.logo_url 
      ? `<img src="${config.logo_url}" alt="Logo" style="max-height: 80px; max-width: 200px; object-fit: contain; display: block; margin: 0 auto 15px;" />`
      : `<div style="font-size: 32px; font-weight: bold; color: #0369a1; margin-bottom: 15px; text-align: center;">Fly Turismo</div>`;
    
    const getCoresOrdem = (cor) => {
      const ordem = { vermelho: 1, azul: 2, verde: 3, amarelo: 4, roxo: 5, rosa: 6, laranja: 7, marrom: 8, cinza: 9, '': 10 };
      return ordem[cor] || 10;
    };
    
    const listaImpressao = [...clientes].sort((a, b) => {
      const corCompare = getCoresOrdem(a?.cor_grupo || '') - getCoresOrdem(b?.cor_grupo || '');
      if (corCompare !== 0) return corCompare;
      
      const grupoCompare = (a?.numero_grupo || 1) - (b?.numero_grupo || 1);
      if (grupoCompare !== 0) return grupoCompare;
      
      return (a?.nome_completo || '').localeCompare(b?.nome_completo || '');
    });

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lista de Passageiros - ${viagem.nome}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #333; -webkit-print-color-adjust: exact; background: white; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
          .info-viagem { display: flex; justify-content: space-between; background: #f0f9ff; padding: 10px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #bae6fd; font-size: 12px; }
          .info-item { font-weight: 600; color: #0369a1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: middle; }
          th { background-color: #0ea5e9; color: white; font-weight: 700; text-transform: uppercase; font-size: 10px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .tipo-badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; display: inline-block; text-align: center; min-width: 60px; }
          .bg-adulto { background: #e2e8f0; color: #475569; }
          .bg-crianca { background: #fef9c3; color: #a16207; }
          .bg-colo { background: #f3e8ff; color: #7e22ce; }
          .bg-acomp { background: #dbeafe; color: #0369a1; }
          .assento-box { font-weight: bold; font-size: 12px; color: #0f172a; }
          .sem-assento { color: #ef4444; font-style: italic; font-size: 10px; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoSection}
          <h2 style="margin: 5px 0; color: #0f172a;">LISTA DE PASSAGEIROS</h2>
          <p style="margin: 0; color: #64748b; font-size: 12px;">${viagem.nome} - ${viagem.destino}</p>
        </div>

        <div class="info-viagem">
          <span class="info-item">📅 Saída: ${format(new Date(viagem.data_saida), "dd/MM/yyyy")}</span>
          <span class="info-item">🚌 Modelo: ${viagem.modelo_onibus} (${viagem.vagas_totais} lug.)</span>
          <span class="info-item">👥 Passageiros: ${clientes.length}</span>
          <span class="info-item">🕒 Emitido em: ${hoje}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">Nº</th>
              <th style="width: 5%;">Grupo</th>
              <th style="width: 30%;">Nome Completo</th>
              <th style="width: 13%;">CPF</th>
              <th style="width: 13%;">Telefone</th>
              <th style="width: 9%;">Tipo</th>
              <th style="width: 10%;">Assento</th>
              <th style="width: 15%;">Local Embarque</th>
            </tr>
          </thead>
          <tbody>
    `;

    const getCorHex = (cor, grupo) => {
      if (!cor) return null;
      const numGrupo = grupo || 1;
      const coresHex = {
        vermelho: ['#fca5a5', '#ef4444', '#b91c1c', '#7f1d1d'],
        azul: ['#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'],
        verde: ['#6ee7b7', '#10b981', '#047857', '#064e3b'],
        amarelo: ['#fde047', '#eab308', '#a16207', '#713f12'],
        roxo: ['#d8b4fe', '#a855f7', '#7e22ce', '#581c87'],
        rosa: ['#f9a8d4', '#ec4899', '#be185d', '#831843'],
        laranja: ['#fdba74', '#f97316', '#c2410c', '#7c2d12'],
        marrom: ['#d97706', '#b45309', '#92400e', '#78350f'],
        cinza: ['#d1d5db', '#6b7280', '#374151', '#1f2937']
      };
      const grupoIndex = (numGrupo - 1) % 4;
      return coresHex[cor]?.[grupoIndex] || coresHex[cor]?.[0];
    };

    listaImpressao.forEach((c, index) => {
      const prevCliente = index > 0 ? listaImpressao[index - 1] : null;
      const isNewGroup = prevCliente && (
        prevCliente.cor_grupo !== c.cor_grupo || 
        prevCliente.numero_grupo !== c.numero_grupo
      );
      let tipo = "Adulto";
      let classe = "bg-adulto";

      if (c.e_crianca_colo) {
        tipo = "Colo";
        classe = "bg-colo";
      } else if (c.idade !== null && c.idade !== undefined && c.idade <= 5) {
        tipo = "Isento";
        classe = "bg-colo";
      } else if (c.idade >= 6 && c.idade <= 11) {
        tipo = "Criança";
        classe = "bg-crianca";
      }

      let assento = `<span class="sem-assento">Sem assento</span>`;
      if (c.poltrona) {
        assento = `<span class="assento-box">#${c.poltrona}</span>`;
      }

      const corHex = getCorHex(c?.cor_grupo, c?.numero_grupo);
      const corBolinha = corHex
        ? `<div style="display: inline-flex; align-items: center; gap: 4px;">
             <div style="width: 16px; height: 16px; border-radius: 50%; background: ${corHex}; display: inline-block; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
             <span style="font-size: 10px; font-weight: bold; color: #64748b;">G${c.numero_grupo || 1}</span>
           </div>`
        : '-';

      if (isNewGroup) {
        html += `
          <tr>
            <td colspan="8" style="height: 3px; background: linear-gradient(to right, transparent, #cbd5e1, transparent); padding: 0;"></td>
          </tr>
        `;
      }

      html += `
        <tr>
          <td style="text-align: center; font-weight: bold; color: #64748b;">${index + 1}</td>
          <td style="text-align: center;">${corBolinha}</td>
          <td style="font-weight: 600; color: #1e293b;">${(c?.nome_completo || '').toUpperCase()}</td>
          <td>${c?.cpf || '-'}</td>
          <td>${c?.telefone || '-'}</td>
          <td><span class="tipo-badge ${classe}">${tipo}</span></td>
          <td style="text-align: center;">${assento}</td>
          <td>${c?.local_embarque || '-'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    return html;
  };

  const imprimirListaPassageiros = () => {
    const html = generateDocumentHTML();
    if (!html) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    
    // Add print button to the window
    printWindow.document.body.innerHTML += `
        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 12px 24px; background: #0ea5e9; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            🖨️ IMPRIMIR LISTA
          </button>
        </div>
    `;
    printWindow.document.close();
  };

  const salvarDocumento = async () => {
    const html = generateDocumentHTML();
    if (!html) return;

    // Create a Blob from the HTML string
    const blob = new Blob([html], { type: 'text/html' });
    // Create a File object from the Blob
    const fileName = `Lista-Passageiros-${viagem.nome.replace(/[^a-z0-9]/gi, '_')}.html`;
    const file = new File([blob], fileName, { type: 'text/html' });

    // Upload logic
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: file });
      
      await saveDocumentMutation.mutateAsync({
        nome: fileName,
        url: file_url,
        tipo: 'Lista de Passageiros',
        id_viagem: viagem.id,
        tamanho: blob.size
      });
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      alert("Erro ao salvar documento. Tente novamente.");
    }
  };

  const getCoresOrdem = React.useCallback((cor) => {
    const ordem = { vermelho: 1, azul: 2, verde: 3, amarelo: 4, roxo: 5, rosa: 6, laranja: 7, marrom: 8, cinza: 9, '': 10 };
    return ordem[cor] || 10;
  }, []);

  const filteredAndSortedClientes = React.useMemo(() => {
    const filtered = clientes.filter(cliente => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        cliente.nome_completo?.toLowerCase().includes(searchLower) ||
        cliente.cpf?.includes(searchLower) ||
        cliente.telefone?.includes(searchLower) ||
        cliente.nome_crianca_colo?.toLowerCase().includes(searchLower) ||
        (cliente.poltrona && cliente.poltrona.toString().includes(searchLower))
      );
    });

    return filtered.sort((a, b) => {
      const corCompare = getCoresOrdem(a?.cor_grupo || '') - getCoresOrdem(b?.cor_grupo || '');
      if (corCompare !== 0) return corCompare;
      
      const grupoCompare = (a?.numero_grupo || 1) - (b?.numero_grupo || 1);
      if (grupoCompare !== 0) return grupoCompare;
      
      return (a?.nome_completo || '').localeCompare(b?.nome_completo || '');
    });
  }, [clientes, searchTerm, getCoresOrdem]);

  if (!viagemId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nenhuma viagem selecionada</p>
          <Link to={createPageUrl('Viagens')}>
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Viagens
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!viagem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const clientesPagos = clientes.filter(c => c.status_pagamento === 'Pago').length;
  const clientesPendentes = clientes.filter(c => c.status_pagamento === 'Pendente').length;
  const clientesParciais = clientes.filter(c => c.status_pagamento === 'Parcial').length;

  const totalPassageiros = clientes.length;
  const comAssento = clientes.filter(c => c.poltrona).length;
  const semAssento = clientes.filter(c => !c.poltrona).length;
  const criancasColo = clientes.filter(c => c.e_crianca_colo).length;
  const acompanhantesCount = clientes.filter(c => c.id_cliente_principal).length;

  const modeloNome = viagem.modelo_onibus === 'DD' ? 'Double Deck' : viagem.modelo_onibus === 'VAN' ? 'VAN' : 'Low Driver';

  return (
    <div className="p-6 md:p-8 space-y-6">
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">✅ {editingCliente ? 'Cliente atualizado' : 'Cliente adicionado'} com sucesso!</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link to={createPageUrl('Viagens')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{viagem.nome}</h1>
          <p className="text-muted-foreground mt-1">Detalhes completos da viagem</p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="text-sm px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200 shadow-sm">
              👥 Total: {totalPassageiros} pessoas
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-1 bg-white border-green-200 text-green-700">
              💺 Com Assento: {comAssento}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-1 bg-white border-orange-200 text-orange-700">
              🚶 Sem Assento: {semAssento}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-1 bg-white border-purple-200 text-purple-700">
              👶 Colo: {criancasColo}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-1 bg-white border-gray-200 text-gray-700">
              🔗 Acompanhantes: {acompanhantesCount}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={imprimirListaPassageiros}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={salvarDocumento} className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <Save className="w-4 h-4 mr-2" />
            Salvar Documento
          </Button>
          <Button 
            onClick={() => {
              resetForm(); 
              setShowClienteForm(true);
            }}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Cliente
          </Button>
        </div>
      </div>

      {viagem.imagens_urls && viagem.imagens_urls.length > 0 && (
        <Card className="overflow-hidden border-none shadow-xl">
          <div className="relative h-96 bg-gradient-to-br from-sky-400 to-blue-600">
            <img 
              src={viagem.imagens_urls[0]} 
              alt={viagem.nome}
              className="w-full h-full object-cover"
            />
          </div>
        </Card>
      )}

      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="detalhes">Detalhes e Passageiros</TabsTrigger>
          <TabsTrigger value="documentos">Documentos da Viagem</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-6">
      <div className="grid md:grid-cols-5 gap-6">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-sky-500" />
              <p className="text-sm text-muted-foreground">Destino</p>
            </div>
            <p className="text-lg font-bold text-foreground">{viagem.destino}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-muted-foreground">Datas</p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {format(new Date(viagem.data_saida), "dd/MM/yy")} - {format(new Date(viagem.data_retorno), "dd/MM/yy")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Bus className="w-5 h-5 text-purple-500" />
              <p className="text-sm text-muted-foreground">Modelo</p>
            </div>
            <p className="text-lg font-bold text-purple-500">{modeloNome}</p>
            <p className="text-xs text-muted-foreground">{viagem.vagas_totais} lugares</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-500" />
              <p className="text-sm text-muted-foreground">Ocupação</p>
            </div>
            <p className="text-lg font-bold text-foreground">
              {viagem.vagas_ocupadas || 0}/{viagem.vagas_totais}
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round(((viagem.vagas_ocupadas || 0) / viagem.vagas_totais) * 100)}% ocupado
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">Total Pessoas</p>
            </div>
            <p className="text-lg font-bold text-primary">{totalPassageiros}</p>
            <p className="text-xs text-muted-foreground">{comAssento} c/ assento, {semAssento} s/ assento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
          <CardContent className="p-6">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-2">💰 1º Valor (Inicial)</p>
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-300">
              R$ {(viagem.valor_1 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30">
          <CardContent className="p-6">
            <p className="text-sm text-sky-700 dark:text-sky-400 font-medium mb-2">💵 2º Valor (Intermediário)</p>
            <h3 className="text-2xl font-bold text-sky-800 dark:text-sky-300">
              R$ {(viagem.valor_2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-6">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-2">💸 3º Valor (Final)</p>
            <h3 className="text-2xl font-bold text-amber-800 dark:text-amber-300">
              R$ {(viagem.valor_3 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30">
          <CardContent className="p-6">
            <p className="text-sm text-purple-700 dark:text-purple-400 font-medium mb-2">Status</p>
            <Badge className="text-lg px-4 py-2">{viagem.status}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl text-foreground">Passageiros Cadastrados ({clientes.length})</CardTitle>
          <div className="flex gap-4 mt-3">
            <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
              {clientesPagos} Pagos
            </Badge>
            <Badge className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400">
              {clientesParciais} Parciais
            </Badge>
            <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
              {clientesPendentes} Pendentes
            </Badge>
          </div>
          
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Buscar passageiro por nome, CPF, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {filteredAndSortedClientes.map((cliente, index, array) => {
              const getCorDisplay = (cor, grupo) => {
                if (!cor) return '';
                const numGrupo = grupo || 1;
                const cores = {
                  vermelho: ['bg-red-300', 'bg-red-500', 'bg-red-700', 'bg-red-900'],
                  azul: ['bg-blue-300', 'bg-blue-500', 'bg-blue-700', 'bg-blue-900'],
                  verde: ['bg-green-300', 'bg-green-500', 'bg-green-700', 'bg-green-900'],
                  amarelo: ['bg-yellow-300', 'bg-yellow-500', 'bg-yellow-700', 'bg-yellow-900'],
                  roxo: ['bg-purple-300', 'bg-purple-500', 'bg-purple-700', 'bg-purple-900'],
                  rosa: ['bg-pink-300', 'bg-pink-500', 'bg-pink-700', 'bg-pink-900'],
                  laranja: ['bg-orange-300', 'bg-orange-500', 'bg-orange-700', 'bg-orange-900'],
                  marrom: ['bg-amber-600', 'bg-amber-700', 'bg-amber-800', 'bg-amber-900'],
                  cinza: ['bg-gray-300', 'bg-gray-500', 'bg-gray-700', 'bg-gray-900']
                };
                const grupoIndex = (numGrupo - 1) % 4;
                return cores[cor]?.[grupoIndex] || cores[cor]?.[0] || '';
              };

              const prevCliente = index > 0 ? array[index - 1] : null;
              const isNewGroup = prevCliente && (
                prevCliente.cor_grupo !== cliente.cor_grupo || 
                prevCliente.numero_grupo !== cliente.numero_grupo
              );

              return (
                <React.Fragment key={cliente.id}>
                  {isNewGroup && (
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-2"></div>
                  )}
              <div key={cliente.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2 min-w-[80px]">
                       <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                       {cliente?.cor_grupo && (
                         <div className="flex items-center gap-1">
                           <div className={`w-5 h-5 rounded-full ${getCorDisplay(cliente.cor_grupo, cliente.numero_grupo)} border-2 border-background shadow-md`} title={`${cliente.cor_grupo} - Grupo ${cliente.numero_grupo || 1}`}></div>
                           <span className="text-xs font-semibold text-muted-foreground">G{cliente.numero_grupo || 1}</span>
                         </div>
                       )}
                     </div>
                    <div className="flex-1">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      {cliente.nome_completo}
                      {cliente.e_crianca_colo && (
                        <Badge className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-xs">
                          Criança de colo
                        </Badge>
                      )}
                      {cliente.poltrona && (
                        <Badge variant="outline" className="ml-2">
                          <Armchair className="w-3 h-3 mr-1" />
                          Poltrona {cliente.poltrona}
                        </Badge>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span>📱 {cliente.telefone}</span>
                      <span>🆔 {cliente.cpf}</span>
                      {cliente.local_embarque && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {cliente.local_embarque}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <Badge className={
                      cliente.status_pagamento === 'Pago' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' :
                      cliente.status_pagamento === 'Parcial' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' :
                      'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                    }>
                      {cliente.status_pagamento}
                    </Badge>
                    
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCliente(cliente)}
                        className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 h-8 px-2"
                        title="Editar cliente"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeClienteMutation.mutate(cliente)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-2"
                        title="Excluir cliente da viagem"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                  </div>
                  </div>
                  </div>
                  </React.Fragment>
                  );
                  })}
            {filteredAndSortedClientes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                <p className="mb-4">Nenhum passageiro cadastrado nesta viagem ainda</p>
                <Button 
                  onClick={() => {
                    resetForm();
                    setShowClienteForm(true);
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Passageiro
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      </TabsContent>

      <TabsContent value="documentos">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Documentos Salvos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentos.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documentos.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate" title={doc.nome}>{doc.nome}</p>
                        <p className="text-xs text-muted-foreground">{doc.tipo} • {format(new Date(doc.created_date || new Date()), "dd/MM/yyyy HH:mm")}</p>
                      </div>
                    </div>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" download>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed border-border">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>Nenhum documento salvo ainda.</p>
                <p className="text-sm mt-1">Use o botão "Salvar Documento" nas listas para arquivar relatórios aqui.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      <Dialog open={showClienteForm} onOpenChange={setShowClienteForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {editingCliente ? 'Editar Cliente' : 'Adicionar Cliente'}: {viagem.nome}
              {viagem?.modo_pirapark && <span className="text-amber-600">🎢</span>}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitCliente} className="space-y-4">
            {viagem?.modo_pirapark && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <p className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                  <span>🎢</span>
                  <span>MODO PIRAPARK ATIVO</span>
                </p>
                <p className="text-xs text-amber-700">
                  Os valores serão calculados automaticamente por faixa etária após informar a data de nascimento.
                </p>
              </div>
            )}

            {!viagem?.modo_pirapark && (
              <div className="border-2 border-sky-200 bg-sky-50 rounded-lg p-4">
                <Label className="font-semibold text-sky-900 mb-3 block">
                  Selecionar valor para este cliente
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {['Valor 1', 'Valor 2', 'Valor 3', 'Valor Personalizado'].map((opcao) => {
                    let valor = 0;
                    let colorClass = 'border-gray-200 hover:border-sky-300';
                    let textColor = 'text-gray-900';
                    
                    if (opcao === 'Valor 1') {
                      valor = viagem?.valor_1 || 0;
                      if (formData.valor_selecionado === opcao) { colorClass = 'border-green-500 bg-green-50'; textColor = 'text-green-900'; }
                    } else if (opcao === 'Valor 2') {
                      valor = viagem?.valor_2 || 0;
                      if (formData.valor_selecionado === opcao) { colorClass = 'border-sky-500 bg-sky-50'; textColor = 'text-sky-900'; }
                    } else if (opcao === 'Valor 3') {
                      valor = viagem?.valor_3 || 0;
                      if (formData.valor_selecionado === opcao) { colorClass = 'border-amber-500 bg-amber-50'; textColor = 'text-amber-900'; }
                    } else { // Valor Personalizado
                      if (formData.valor_selecionado === opcao) { colorClass = 'border-purple-500 bg-purple-50'; textColor = 'text-purple-900'; }
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
                          <p className={`text-sm font-bold ${textColor}`}>
                            R$ {valor.toFixed(2)}
                          </p>
                        )}
                        {opcao === 'Valor Personalizado' && formData.valor_selecionado !== 'Valor Personalizado' && (
                           <p className={`text-sm font-bold ${textColor}`}>
                            R$ 0.00
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {formData.valor_selecionado === 'Valor Personalizado' && (
                  <div className="mt-4">
                    <Label htmlFor="valor_personalizado">Digite o valor personalizado (R$)</Label>
                    <Input
                      id="valor_personalizado"
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

            <Input
              placeholder="Nome completo *"
              value={formData.nome_completo}
              onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
              className="text-lg"
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="CPF *"
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                required
              />
              <Input
                placeholder="Telefone *"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                required
              />
            </div>

            <Input
              placeholder="Local de Embarque (Ex: Marcely - Lontra/MG)"
              value={formData.local_embarque}
              onChange={(e) => setFormData({...formData, local_embarque: e.target.value})}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Nascimento {viagem?.modo_pirapark && '*'}</Label>
                <Input
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => handleIdadeChange(e.target.value)}
                  required={viagem?.modo_pirapark}
                />
              </div>
              <div className="space-y-2">
                <Label>Idade</Label>
                <Input
                  type="number"
                  value={formData.idade}
                  disabled
                  className="bg-gray-50"
                  placeholder="Calculada automaticamente"
                />
              </div>
            </div>

            {viagem?.modo_pirapark && (() => {
              const faixa = getFaixaEtariaPirapark(formData.idade);
              return (
                <div className={`${faixa.color} border-2 rounded-lg p-4`}>
                  <p className="font-bold text-sm mb-2">Faixa Etária Detectada</p>
                  <p className="text-sm">
                    <strong>{faixa.label}</strong>
                  </p>
                  <p className="text-sm mt-1">
                    <strong>Valor automático:</strong> R$ {formData.valor_total_pacote.toFixed(2)}
                  </p>
                </div>
              );
            })()}

            <div className="grid md:grid-cols-2 gap-4">
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
                <Label>Número do Grupo</Label>
                <p className="text-xs text-gray-500 mb-2">Ex: Azul Grupo 1, Azul Grupo 2</p>
                <Input
                  type="number"
                  min="1"
                  value={formData.numero_grupo || 1}
                  onChange={(e) => setFormData({...formData, numero_grupo: parseInt(e.target.value) || 1})}
                  disabled={!formData.cor_grupo}
                  className={!formData.cor_grupo ? "bg-gray-100" : ""}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="e_crianca_colo"
                checked={formData.e_crianca_colo}
                onChange={(e) => setFormData({...formData, e_crianca_colo: e.target.checked})}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <Label htmlFor="e_crianca_colo" className="font-medium text-gray-700 cursor-pointer">
                É criança de colo (não ocupa assento)?
              </Label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select 
                  value={formData.forma_pagamento} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    forma_pagamento: value,
                    numero_parcelas: value === 'À Vista' ? 1 : formData.numero_parcelas
                  })}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowClienteForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" 
                disabled={createClienteMutation.isPending || updateClienteMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {(createClienteMutation.isPending || updateClienteMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCliente ? 'Salvar Alterações' : 'Criar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Removed Dialog for showMapaAssentos */}
    </div>
  );
}