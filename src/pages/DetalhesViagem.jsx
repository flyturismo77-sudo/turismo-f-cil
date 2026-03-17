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
import { ArrowLeft, MapPin, Calendar, Users, Bus, Loader2, Armchair, UserPlus, Printer, CheckCircle, Search, Trash2, Pencil, Save, FileText, Download, Link2, QrCode, Copy, CheckCheck, DollarSign } from "lucide-react";
import DespesasViagem from "@/components/viagens/DespesasViagem";
import { Dialog as QRDialog, DialogContent as QRDialogContent, DialogHeader as QRDialogHeader, DialogTitle as QRDialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
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

  const { toast } = useToast();
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [contratoQR, setContratoQR] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [editingCliente, setEditingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Removed showMapaAssentos and selectedPoltrona states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPagamentoForm, setShowPagamentoForm] = useState(false);
  const [pagamentoCliente, setPagamentoCliente] = useState(null);
  const [pagamentoData, setPagamentoData] = useState({ valor: 0, forma_pagamento: 'PIX', data_pagamento: '', observacoes: '' });
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

  const { data: contratos = [] } = useQuery({
    queryKey: ['contratos-viagem', viagemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formularios_contrato')
        .select('id, nome_completo, status, link_assinatura, assinatura_nome, assinatura_data, created_at')
        .eq('id_viagem', viagemId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
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

  const registrarPagamentoMutation = useMutation({
    mutationFn: async () => {
      if (!pagamentoCliente || !pagamentoData.valor) return;
      const novoValorPago = (pagamentoCliente.valor_pago || 0) + parseFloat(pagamentoData.valor);
      const valorPacote = pagamentoCliente.valor_total_pacote || 0;
      const novoStatus = novoValorPago >= valorPacote ? 'Pago' : novoValorPago > 0 ? 'Parcial' : 'Pendente';
      
      await base44.entities.Cliente.update(pagamentoCliente.id, {
        valor_pago: novoValorPago,
        status_pagamento: novoStatus
      });

      await supabase.from('pagamentos').insert({
        id_cliente: pagamentoCliente.id,
        valor: parseFloat(pagamentoData.valor),
        forma_pagamento: pagamentoData.forma_pagamento,
        data_pagamento: pagamentoData.data_pagamento || new Date().toISOString().split('T')[0],
        observacoes: pagamentoData.observacoes || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes-viagem']);
      setShowPagamentoForm(false);
      setPagamentoCliente(null);
      setPagamentoData({ valor: 0, forma_pagamento: 'PIX', data_pagamento: '', observacoes: '' });
      toast({ title: '✅ Pagamento registrado com sucesso!' });
    },
    onError: (err) => {
      console.error('Erro ao registrar pagamento:', err);
      toast({ title: '❌ Erro ao registrar pagamento', variant: 'destructive' });
    }
  });

  const imprimirListaFinanceira = () => {
    if (!viagem || clientes.length === 0) return;
    const sorted = [...clientes].sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || ''));
    const totalPacote = clientes.reduce((s, c) => s + (c.valor_total_pacote || 0), 0);
    const totalPago = clientes.reduce((s, c) => s + (c.valor_pago || 0), 0);
    const totalSaldo = totalPacote - totalPago;
    const hoje = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

    let html = `<!DOCTYPE html><html><head><title>Lista Financeira - ${viagem.nome}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      body { font-family: 'Segoe UI', sans-serif; font-size: 11px; color: #333; }
      .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
      .header h2 { margin: 0; color: #065f46; }
      .header p { margin: 4px 0 0; color: #6b7280; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #10b981; color: white; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
      td { border-bottom: 1px solid #e5e7eb; padding: 7px 8px; }
      tr:nth-child(even) { background: #f9fafb; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .total-row { background: #ecfdf5; font-weight: bold; }
      .badge { padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 600; }
      .pago { background: #dcfce7; color: #166534; }
      .parcial { background: #fef9c3; color: #854d0e; }
      .pendente { background: #fee2e2; color: #991b1b; }
      .saldo-positivo { color: #dc2626; }
      .saldo-zero { color: #16a34a; }
      @media print { .no-print { display: none !important; } }
    </style></head><body>
    <div class="header">
      <h2>💲 LISTA FINANCEIRA — ${viagem.nome}</h2>
      <p>${viagem.destino} | Emitido em: ${hoje} | Total de Passageiros: ${clientes.length}</p>
    </div>
    <table><thead><tr>
      <th>Nº</th><th>Nome Completo</th><th>CPF</th>
      <th class="text-right">Valor Pacote</th><th class="text-right">Valor Pago</th>
      <th class="text-right">Saldo</th><th class="text-center">Status</th>
    </tr></thead><tbody>`;

    sorted.forEach((c, i) => {
      const vp = c.valor_total_pacote || 0;
      const pg = c.valor_pago || 0;
      const saldo = vp - pg;
      const status = c.status_pagamento || 'Pendente';
      const badgeClass = status === 'Pago' ? 'pago' : status === 'Parcial' ? 'parcial' : 'pendente';
      html += `<tr>
        <td>${i + 1}</td>
        <td><strong>${(c.nome_completo || '').toUpperCase()}</strong></td>
        <td>${c.cpf || '-'}</td>
        <td class="text-right">R$ ${vp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">R$ ${pg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right ${saldo > 0 ? 'saldo-positivo' : 'saldo-zero'}">R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td class="text-center"><span class="badge ${badgeClass}">${status}</span></td>
      </tr>`;
    });

    html += `</tbody><tfoot><tr class="total-row">
      <td colspan="3"><strong>TOTAIS</strong></td>
      <td class="text-right">R$ ${totalPacote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="text-right">R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td class="text-right ${totalSaldo > 0 ? 'saldo-positivo' : 'saldo-zero'}">R$ ${totalSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td></td>
    </tr></tfoot></table>
    <div class="no-print" style="text-align:center;margin-top:20px;">
      <button onclick="window.print()" style="padding:10px 24px;background:#10b981;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:13px;">🖨️ IMPRIMIR</button>
    </div></body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };


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

  const gerarManualPDF = () => {
    const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Manual do Sistema - Fly Turismo</title>
<style>
  @page { size: A4; margin: 15mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; background: #fff; line-height: 1.6; }
  .capa { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 90vh; text-align: center; page-break-after: always; border: 3px solid #7c3aed; border-radius: 12px; padding: 60px 40px; }
  .capa h1 { font-size: 36pt; font-weight: 900; color: #7c3aed; margin: 0 0 10px; letter-spacing: -1px; }
  .capa h2 { font-size: 18pt; color: #64748b; font-weight: 400; margin: 0 0 40px; }
  .capa .badge { background: #7c3aed; color: #fff; border-radius: 6px; padding: 8px 20px; font-size: 11pt; display: inline-block; margin-bottom: 40px; }
  .capa .data { font-size: 10pt; color: #94a3b8; margin-top: 30px; }
  .indice { page-break-after: always; padding: 20px 0; }
  .indice h2 { font-size: 20pt; color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 8px; margin-bottom: 20px; }
  .indice-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px dashed #e2e8f0; font-size: 10.5pt; }
  .indice-item .num { color: #7c3aed; font-weight: 700; min-width: 26px; }
  .secao { page-break-before: always; }
  .secao-header { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px; }
  .secao-header .num-sec { font-size: 10pt; opacity: 0.8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 2px; }
  .secao-header h2 { font-size: 20pt; margin: 0; font-weight: 800; }
  .secao-header p { margin: 6px 0 0; opacity: 0.9; font-size: 10pt; }
  h3 { font-size: 13pt; color: #4f46e5; margin: 22px 0 8px; padding-left: 12px; border-left: 4px solid #7c3aed; }
  p { margin: 0 0 10px; text-align: justify; }
  .dica { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 10px 14px; border-radius: 0 6px 6px 0; margin: 12px 0; font-size: 10.5pt; }
  .dica strong { color: #16a34a; }
  .atencao { background: #fff7ed; border-left: 4px solid #ea580c; padding: 10px 14px; border-radius: 0 6px 6px 0; margin: 12px 0; font-size: 10.5pt; }
  .atencao strong { color: #ea580c; }
  .info { background: #eff6ff; border-left: 4px solid #2563eb; padding: 10px 14px; border-radius: 0 6px 6px 0; margin: 12px 0; font-size: 10.5pt; }
  .info strong { color: #2563eb; }
  .tela { border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #f8fafc; margin: 14px 0; font-size: 9.5pt; }
  .tela .barra { background: #1e293b; color: #94a3b8; padding: 6px 12px; border-radius: 4px 4px 0 0; margin: -16px -16px 12px; font-size: 9pt; display: flex; gap: 8px; align-items: center; }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .dot-r { background: #ef4444; }
  .dot-y { background: #eab308; }
  .dot-g { background: #22c55e; }
  .tela-linha { display: flex; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
  .card-mini { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; flex: 1; min-width: 100px; }
  .card-mini .label { font-size: 8.5pt; color: #64748b; margin-bottom: 4px; }
  .card-mini .valor { font-size: 14pt; font-weight: 700; color: #1e293b; }
  .card-mini.verde .valor { color: #16a34a; }
  .card-mini.azul .valor { color: #2563eb; }
  .card-mini.roxa .valor { color: #7c3aed; }
  .card-mini.ambar .valor { color: #d97706; }
  .steps { list-style: none; padding: 0; margin: 12px 0; }
  .steps li { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
  .steps li .step-num { background: #7c3aed; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .steps li .step-txt { flex: 1; font-size: 10.5pt; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9.5pt; }
  th { background: #7c3aed; color: #fff; padding: 8px 10px; text-align: left; }
  td { border-bottom: 1px solid #e2e8f0; padding: 7px 10px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .status { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 8.5pt; font-weight: 600; }
  .s-verde { background: #dcfce7; color: #16a34a; }
  .s-amarelo { background: #fef9c3; color: #a16207; }
  .s-vermelho { background: #fee2e2; color: #dc2626; }
  .s-azul { background: #dbeafe; color: #1d4ed8; }
  .rodape { margin-top: 20px; border-top: 2px solid #e2e8f0; padding-top: 12px; font-size: 9pt; color: #94a3b8; text-align: center; }
  .btn-print { position: fixed; bottom: 24px; right: 24px; background: #7c3aed; color: #fff; border: none; border-radius: 50px; padding: 14px 28px; font-size: 13pt; font-weight: 700; cursor: pointer; box-shadow: 0 4px 20px rgba(124,58,237,0.4); z-index: 999; }
  @media print { .btn-print { display: none; } .capa { min-height: auto; } }
</style>
</head>
<body>
<button class="btn-print" onclick="window.print()">🖨️ Salvar como PDF</button>

<div class="capa">
  <div style="font-size:60pt;margin-bottom:20px;">✈️</div>
  <h1>Fly Turismo</h1>
  <h2>Sistema de Gestão de Viagens</h2>
  <div class="badge">📖 MANUAL COMPLETO DO SISTEMA</div>
  <p style="max-width:480px;color:#64748b;font-size:11pt;">Este manual descreve detalhadamente todos os módulos e funcionalidades do sistema de gestão, desde o cadastro de viagens até o check-in de passageiros. Destinado a administradores e funcionários.</p>
  <div class="data">Gerado em ${now}</div>
</div>

<div class="indice">
  <h2>📋 Índice</h2>
  <div class="indice-item"><span><span class="num">1.</span> Dashboard — Visão Geral</span><span style="color:#94a3b8">Pág. 3</span></div>
  <div class="indice-item"><span><span class="num">2.</span> Módulo Viagens — Gestão de Pacotes</span><span style="color:#94a3b8">Pág. 4</span></div>
  <div class="indice-item"><span><span class="num">3.</span> Detalhes da Viagem — Passageiros e Contratos</span><span style="color:#94a3b8">Pág. 5</span></div>
  <div class="indice-item"><span><span class="num">4.</span> Mapa de Assentos — Alocação de Poltronas</span><span style="color:#94a3b8">Pág. 6</span></div>
  <div class="indice-item"><span><span class="num">5.</span> Módulo Financeiro — Parcelas e Recebimentos</span><span style="color:#94a3b8">Pág. 7</span></div>
  <div class="indice-item"><span><span class="num">6.</span> Contratos Digitais — Geração e Assinatura</span><span style="color:#94a3b8">Pág. 8</span></div>
  <div class="indice-item"><span><span class="num">7.</span> Equipe — Gerenciamento de Funcionários</span><span style="color:#94a3b8">Pág. 9</span></div>
  <div class="indice-item"><span><span class="num">8.</span> Check-in e Embarque — QR Code</span><span style="color:#94a3b8">Pág. 10</span></div>
  <div class="indice-item"><span><span class="num">9.</span> Calendário — Viagens e Parcelas</span><span style="color:#94a3b8">Pág. 11</span></div>
  <div class="indice-item"><span><span class="num">10.</span> Clientes — Base de Passageiros</span><span style="color:#94a3b8">Pág. 12</span></div>
  <div class="indice-item"><span><span class="num">11.</span> Fornecedores — Parceiros e Serviços</span><span style="color:#94a3b8">Pág. 13</span></div>
  <div class="indice-item"><span><span class="num">12.</span> Relatórios e Exportação</span><span style="color:#94a3b8">Pág. 14</span></div>
  <div class="indice-item"><span><span class="num">13.</span> Configurações do Sistema</span><span style="color:#94a3b8">Pág. 15</span></div>
  <div class="indice-item"><span><span class="num">14.</span> Formulários Personalizados</span><span style="color:#94a3b8">Pág. 16</span></div>
  <div class="indice-item"><span><span class="num">15.</span> Boas Práticas e Fluxo Recomendado</span><span style="color:#94a3b8">Pág. 17</span></div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 1</div><h2>📊 Dashboard — Visão Geral</h2><p>Painel principal com resumo de todas as operações em tempo real</p></div>
  <p>O Dashboard é a primeira tela exibida após o login. Ele apresenta um resumo rápido de toda a operação da empresa: viagens, passageiros, financeiro e atividades recentes.</p>
  <h3>Cartões de Estatísticas</h3>
  <div class="tela">
    <div class="barra"><span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span><span style="margin-left:8px;font-size:8pt;">Sistema Fly Turismo — Dashboard</span></div>
    <div class="tela-linha">
      <div class="card-mini azul"><div class="label">✈️ Total de Viagens</div><div class="valor">12</div></div>
      <div class="card-mini verde"><div class="label">👥 Passageiros</div><div class="valor">348</div></div>
      <div class="card-mini roxa"><div class="label">💰 Receita do Mês</div><div class="valor">R$ 42.800</div></div>
      <div class="card-mini ambar"><div class="label">⚠️ Parcelas Vencidas</div><div class="valor">7</div></div>
    </div>
  </div>
  <p>Cada cartão exibe um número atualizado em tempo real. Abaixo há um feed de atividades recentes com últimos cadastros, pagamentos e alterações.</p>
  <div class="dica"><strong>✅ Dica:</strong> Verifique o Dashboard toda manhã. Ele alerta sobre parcelas vencidas e viagens próximas.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 2</div><h2>✈️ Módulo Viagens — Gestão de Pacotes</h2><p>Cadastro, edição e acompanhamento de todas as viagens disponíveis</p></div>
  <p>O módulo de Viagens é o coração do sistema. Aqui são criadas todas as excursões da empresa com destino, datas, capacidade, valores e status.</p>
  <h3>Como Criar uma Nova Viagem</h3>
  <ul class="steps">
    <li><div class="step-num">1</div><div class="step-txt">Acesse <strong>Viagens</strong> no menu lateral.</div></li>
    <li><div class="step-num">2</div><div class="step-txt">Clique em <strong>"Nova Viagem"</strong> no canto superior direito.</div></li>
    <li><div class="step-num">3</div><div class="step-txt">Preencha: <strong>Nome</strong>, <strong>Destino</strong>, <strong>Data de Saída</strong> e <strong>Data de Retorno</strong>.</div></li>
    <li><div class="step-num">4</div><div class="step-txt">Selecione o <strong>Modelo do Ônibus</strong>: Low Driver (44 lugares), Double Deck ou VAN.</div></li>
    <li><div class="step-num">5</div><div class="step-txt">Defina até <strong>3 faixas de valor</strong> (lote 1, 2 e 3) e faça upload de imagens.</div></li>
    <li><div class="step-num">6</div><div class="step-txt">Clique em <strong>"Salvar Viagem"</strong>. A viagem aparece com status <span class="status s-azul">Aberta</span>.</div></li>
  </ul>
  <h3>Status das Viagens</h3>
  <table>
    <tr><th>Status</th><th>Significado</th><th>Ação Típica</th></tr>
    <tr><td><span class="status s-azul">Aberta</span></td><td>Aceitando inscrições</td><td>Adicionar clientes, divulgar</td></tr>
    <tr><td><span class="status s-amarelo">Em andamento</span></td><td>Viagem em curso</td><td>Check-in, monitoramento</td></tr>
    <tr><td><span class="status s-verde">Concluída</span></td><td>Finalizada com sucesso</td><td>Fechamento financeiro</td></tr>
    <tr><td><span class="status s-vermelho">Cancelada</span></td><td>Viagem cancelada</td><td>Devoluções, comunicado</td></tr>
  </table>
  <h3>Modo Pirapark</h3>
  <p>Ativa cálculo automático de valor por faixa etária: 0-5 anos = Isento (R$ 0), 6-11 anos = Criança (R$ 389,90), 12+ anos = Adulto (R$ 429,90).</p>
  <div class="dica"><strong>✅ Dica:</strong> Defina os 3 valores (lotes) antes de começar as vendas. Registre qual valor cada cliente pagou no momento da compra.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 3</div><h2>🗂️ Detalhes da Viagem — Passageiros e Contratos</h2><p>Gerenciamento completo de passageiros, documentos e contratos de uma viagem</p></div>
  <p>Ao clicar em uma viagem, você acessa a página de Detalhes — a mais completa do sistema, reunindo todas as informações operacionais.</p>
  <h3>Como Adicionar um Passageiro</h3>
  <ul class="steps">
    <li><div class="step-num">1</div><div class="step-txt">Clique em <strong>"Adicionar Cliente"</strong> no canto superior direito.</div></li>
    <li><div class="step-num">2</div><div class="step-txt">Preencha: nome, CPF, telefone, data de nascimento e local de embarque.</div></li>
    <li><div class="step-num">3</div><div class="step-txt">Selecione o <strong>Valor do pacote</strong> e a <strong>forma de pagamento</strong>.</div></li>
    <li><div class="step-num">4</div><div class="step-txt">Se houver criança de colo, marque a opção e preencha os dados da criança.</div></li>
    <li><div class="step-num">5</div><div class="step-txt">Defina cor e número de grupo para organizar famílias/amigos juntos.</div></li>
    <li><div class="step-num">6</div><div class="step-txt">Clique em <strong>"Salvar"</strong>. A poltrona é atribuída depois no mapa de assentos.</div></li>
  </ul>
  <h3>Seção: Contratos desta Viagem</h3>
  <p>Abaixo da lista de passageiros há a seção com todos os contratos vinculados. Para contratos pendentes: botões de <strong>Copiar Link</strong> e <strong>QR Code</strong>. Para contratos assinados: exibe o nome e data da assinatura.</p>
  <h3>Impressão da Lista</h3>
  <p>O botão <strong>"Imprimir"</strong> gera a lista A4 com todos os passageiros, assentos, local de embarque e tipo, organizada por grupos e cores — ideal para o guia no dia da viagem.</p>
  <div class="dica"><strong>✅ Dica:</strong> Use o campo de busca para encontrar passageiros rapidamente por nome, CPF ou telefone.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 4</div><h2>💺 Mapa de Assentos — Alocação de Poltronas</h2><p>Interface visual para atribuir poltronas a cada passageiro</p></div>
  <p>O mapa visual do ônibus permite atribuir poltronas numeradas a cada passageiro, garantindo organização no embarque.</p>
  <h3>Como Atribuir uma Poltrona</h3>
  <ul class="steps">
    <li><div class="step-num">1</div><div class="step-txt">Acesse <strong>Assentos</strong> e selecione a viagem.</div></li>
    <li><div class="step-num">2</div><div class="step-txt">Clique em uma poltrona <strong>verde (disponível)</strong>.</div></li>
    <li><div class="step-num">3</div><div class="step-txt">Selecione o passageiro na lista que aparecer e confirme.</div></li>
    <li><div class="step-num">4</div><div class="step-txt">A poltrona muda de cor indicando que está ocupada.</div></li>
  </ul>
  <table>
    <tr><th>Cor</th><th>Significado</th></tr>
    <tr><td>🟩 Verde</td><td>Disponível — pode ser atribuída</td></tr>
    <tr><td>🟥 Vermelho/Colorida</td><td>Ocupada — com passageiro</td></tr>
    <tr><td>⬛ Cinza</td><td>Bloqueada ou fora de uso</td></tr>
  </table>
  <table>
    <tr><th>Modelo</th><th>Capacidade</th><th>Layout</th></tr>
    <tr><td>Low Driver (JG 44)</td><td>44 poltronas</td><td>4 colunas (2+2)</td></tr>
    <tr><td>Double Deck</td><td>Até 60 poltronas</td><td>2 andares</td></tr>
    <tr><td>VAN</td><td>Até 16 lugares</td><td>Compacto</td></tr>
  </table>
  <div class="atencao"><strong>⚠️ Importante:</strong> Adicione o passageiro primeiro em Detalhes da Viagem, depois atribua a poltrona. Crianças de colo não recebem poltrona.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 5</div><h2>💰 Módulo Financeiro — Parcelas e Recebimentos</h2><p>Controle completo de recebimentos, parcelas, alertas e situação por viagem</p></div>
  <p>Acompanhe todos os pagamentos dos passageiros, gere parcelas, registre recebimentos e visualize a saúde financeira de cada viagem.</p>
  <h3>Como Registrar um Pagamento</h3>
  <ul class="steps">
    <li><div class="step-num">1</div><div class="step-txt">Acesse <strong>Recebimentos</strong> e selecione a viagem.</div></li>
    <li><div class="step-num">2</div><div class="step-txt">Encontre o passageiro e clique em <strong>"Registrar Pagamento"</strong>.</div></li>
    <li><div class="step-num">3</div><div class="step-txt">Informe valor, data, forma de pagamento e anexe o comprovante.</div></li>
    <li><div class="step-num">4</div><div class="step-txt">Confirme. O status do passageiro é atualizado automaticamente.</div></li>
  </ul>
  <p>Parcelas: <span class="status s-verde">Pagas</span> = quitadas | <span class="status s-amarelo">Pendentes</span> = dentro do prazo | <span class="status s-vermelho">Vencidas</span> = em atraso.</p>
  <p>O sistema alerta automaticamente sobre parcelas que vencem nos <strong>próximos 7 dias</strong> e parcelas já vencidas. O módulo <strong>Despesas</strong> registra gastos da empresa e da equipe, permitindo calcular a <strong>Rentabilidade Real</strong>.</p>
  <div class="dica"><strong>✅ Dica:</strong> Registre pagamentos no dia em que ocorrem. Acesse o Calendário de Parcelas toda semana para identificar vencimentos próximos.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 6</div><h2>📝 Contratos Digitais — Geração e Assinatura</h2><p>Contratos jurídicos automáticos com assinatura eletrônica validada</p></div>
  <p>Gera contratos de viagem personalizados e permite assinatura eletrônica pelo celular do cliente, sem impressão.</p>
  <h3>Como Gerar um Contrato</h3>
  <ul class="steps">
    <li><div class="step-num">1</div><div class="step-txt">Acesse <strong>Contratos</strong> e clique em <strong>"Novo Contrato"</strong>.</div></li>
    <li><div class="step-num">2</div><div class="step-txt">Selecione a viagem e preencha os dados do contratante (responsável).</div></li>
    <li><div class="step-num">3</div><div class="step-txt">Adicione passageiros, valor total, parcelas e dia de vencimento.</div></li>
    <li><div class="step-num">4</div><div class="step-txt">Clique em <strong>"Gerar Contrato"</strong>. Um link único de assinatura é criado.</div></li>
    <li><div class="step-num">5</div><div class="step-txt">Compartilhe via <strong>Copiar Link</strong> (WhatsApp/e-mail) ou <strong>QR Code</strong>.</div></li>
  </ul>
  <h3>Processo de Assinatura pelo Cliente</h3>
  <ul class="steps">
    <li><div class="step-num">1</div><div class="step-txt">Cliente acessa o link pelo celular — contrato completo é exibido.</div></li>
    <li><div class="step-num">2</div><div class="step-txt">Informa nome completo e CPF para validar identidade.</div></li>
    <li><div class="step-num">3</div><div class="step-txt">Clica em <strong>"Assinar"</strong>. Sistema registra nome, CPF, data/hora e IP.</div></li>
    <li><div class="step-num">4</div><div class="step-txt">PDF gerado automaticamente com bloco de assinatura no rodapé.</div></li>
  </ul>
  <div class="info"><strong>ℹ️ Validade Jurídica:</strong> A assinatura registra IP, data e confirmação por CPF, conferindo validade legal ao documento.</div>
  <div class="dica"><strong>✅ Dica:</strong> Gere o contrato assim que o cliente confirmar a reserva. Clientes que assinam digitalmente confirmam o compromisso.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 7</div><h2>👨‍💼 Equipe — Gerenciamento de Funcionários</h2><p>Cadastro e controle dos membros da equipe por viagem</p></div>
  <p>Cadastre guias, motoristas, auxiliares e coordenadores. Cada membro pode ser vinculado a viagens específicas.</p>
  <ul class="steps">
    <li><div class="step-num">1</div><div class="step-txt">Acesse <strong>Equipe</strong> e clique em <strong>"Adicionar Membro"</strong>.</div></li>
    <li><div class="step-num">2</div><div class="step-txt">Preencha: nome, cargo, CPF, telefone e e-mail.</div></li>
    <li><div class="step-num">3</div><div class="step-txt">Vincule à viagem desejada (opcional) e salve.</div></li>
  </ul>
  <p>Em <strong>Despesas Pessoal</strong>, registre diárias, adiantamentos e outros gastos vinculados a cada membro e viagem para controle preciso.</p>
  <div class="dica"><strong>✅ Dica:</strong> Mantenha o cadastro atualizado com foto e contato para facilitar a comunicação durante a viagem.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 8</div><h2>🛂 Check-in e Embarque — QR Code</h2><p>Controle ágil de embarque com QR Code por passageiro</p></div>
  <p>Usado no dia da viagem para controlar o embarque. Cada passageiro tem um QR Code único com seus dados.</p>
  <ul class="steps">
    <li><div class="step-num">1</div><div class="step-txt">Acesse <strong>Check-in / Embarque</strong> e selecione a viagem.</div></li>
    <li><div class="step-num">2</div><div class="step-txt">Para cada passageiro: marque manualmente ou use o QR Code para confirmar embarque.</div></li>
    <li><div class="step-num">3</div><div class="step-txt">Use o filtro por <strong>Local de Embarque</strong> para controlar cada ponto de coleta.</div></li>
    <li><div class="step-num">4</div><div class="step-txt">A barra de progresso mostra em tempo real: <strong>32/44 embarcados (72%)</strong>.</div></li>
  </ul>
  <div class="info"><strong>ℹ️ Persistência:</strong> O progresso de check-in fica salvo no dispositivo. Pode fechar e reabrir sem perder dados.</div>
  <div class="dica"><strong>✅ Dica:</strong> Deixe a tela aberta no tablet do guia durante todo o embarque para controle em tempo real.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 9</div><h2>📅 Calendário — Viagens e Parcelas</h2><p>Visão mensal de viagens programadas e vencimentos financeiros</p></div>
  <p>Visão mensal com dois tipos de eventos: viagens programadas e vencimentos de parcelas.</p>
  <p><strong>Aba Viagens:</strong> Exibe datas de saída e retorno coloridas por status. <strong>Aba Parcelas:</strong> Vencimentos por passageiro — <span class="status s-vermelho">🔴 Vencida</span> | <span class="status s-amarelo">🟡 Pendente</span> | <span class="status s-verde">🟢 Paga</span>.</p>
  <p>Abaixo do calendário: resumo financeiro com <strong>Total Vencido</strong>, <strong>A Vencer</strong> e <strong>Total Pago</strong> do mês.</p>
  <div class="dica"><strong>✅ Dica:</strong> Revise o Calendário toda semana para identificar vencimentos próximos e fazer cobranças preventivas.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 10</div><h2>👥 Clientes — Base de Passageiros</h2><td>Cadastro geral e histórico de todos os passageiros</td></div>
  <p>Base completa de todos os passageiros cadastrados. Visualize histórico de viagens, situação financeira e dados pessoais. Pesquise por nome, CPF ou telefone. Filtre por viagem ou status de pagamento.</p>
  <p>O sistema permite <strong>importação em massa</strong> via arquivo JSON — útil para migrar dados de sistemas anteriores.</p>
  <div class="atencao"><strong>⚠️ LGPD:</strong> Dados de clientes são confidenciais. Não compartilhe listagens sem necessidade. Todos os acessos são registrados nos Logs de Auditoria.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 11</div><h2>🏢 Fornecedores — Parceiros e Serviços</h2><p>Cadastro de hotéis, transportadoras, guias e parceiros</p></div>
  <p>Mantém o cadastro de empresas e profissionais parceiros: hotéis, restaurantes, transportadoras, guias e parques.</p>
  <table>
    <tr><th>Categoria</th><th>Exemplos</th></tr>
    <tr><td>Hospedagem</td><td>Hotéis, pousadas, resorts</td></tr>
    <tr><td>Transporte</td><td>Transportadoras, locadoras</td></tr>
    <tr><td>Alimentação</td><td>Restaurantes, buffets</td></tr>
    <tr><td>Lazer / Parques</td><td>Parques temáticos, atrações</td></tr>
    <tr><td>Guias</td><td>Guias turísticos profissionais</td></tr>
    <tr><td>Seguro</td><td>Seguradoras de viagem</td></tr>
  </table>
  <div class="dica"><strong>✅ Dica:</strong> Vincule pagamentos a fornecedores nas Despesas da Empresa. Rastreie quanto foi gasto com cada parceiro por viagem.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 12</div><h2>📈 Relatórios e Exportação</h2><p>Relatórios financeiros, listas e exportação de dados</p></div>
  <table>
    <tr><th>Relatório</th><th>O que contém</th></tr>
    <tr><td>Lista de Passageiros</td><td>Passageiros com assento, tipo e local de embarque</td></tr>
    <tr><td>Financeiro por Viagem</td><td>Receitas, despesas, saldo e rentabilidade</td></tr>
    <tr><td>Parcelas em Aberto</td><td>Clientes com parcelas pendentes ou vencidas</td></tr>
    <tr><td>Histórico de Pagamentos</td><td>Todos os pagamentos no período</td></tr>
    <tr><td>Rentabilidade</td><td>Lucro líquido por viagem (receita − despesas)</td></tr>
  </table>
  <p>Exporte dados para <strong>CSV/Excel</strong> no menu Exportação. Em Detalhes da Viagem, <strong>"Salvar Documento"</strong> arquiva a lista na aba Documentos criando histórico permanente.</p>
  <div class="dica"><strong>✅ Dica:</strong> Gere o relatório de Rentabilidade após cada viagem para análise e planejamento futuro.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 13</div><h2>⚙️ Configurações do Sistema</h2><p>Personalização da empresa, identidade visual e dados de contato</p></div>
  <p>Personalize o sistema com dados da empresa: nome, logo, slogan, endereço, telefone, WhatsApp, redes sociais e texto "Sobre nós". Defina cor primária e secundária usadas nos documentos. No menu <strong>Usuários</strong>, o administrador gerencia acessos.</p>
  <div class="atencao"><strong>⚠️ Atenção:</strong> Apenas administradores acessam Configurações e Usuários. O sistema tem dois perfis: <strong>Administrador</strong> (acesso total) e <strong>Funcionário</strong> (acesso operacional).</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 14</div><h2>📋 Formulários Personalizados</h2><p>Formulários de inscrição customizados e públicos</p></div>
  <p>Crie formulários de inscrição personalizados para divulgar publicamente. Clientes preenchem online e os dados chegam direto ao sistema.</p>
  <ul class="steps">
    <li><div class="step-num">1</div><div class="step-txt">Acesse <strong>Formulários</strong> e crie um novo formulário.</div></li>
    <li><div class="step-num">2</div><div class="step-txt">Defina título, descrição e campos personalizados.</div></li>
    <li><div class="step-num">3</div><div class="step-txt">Ative o formulário e copie o link público para divulgar.</div></li>
  </ul>
  <p>A página <strong>/InscricaoViagem</strong> é o formulário público padrão — divulgue nas redes sociais junto com a arte da viagem.</p>
  <div class="dica"><strong>✅ Dica:</strong> Dados de inscrições chegam prontos no sistema, eliminando retrabalho de digitação.</div>
</div>

<div class="secao">
  <div class="secao-header"><div class="num-sec">Módulo 15</div><h2>🏆 Boas Práticas e Fluxo Recomendado</h2><p>Roteiro ideal do planejamento ao encerramento de uma viagem</p></div>
  <h3>📌 Fluxo Completo de uma Viagem</h3>
  <div class="tela">
    <div class="barra"><span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span><span style="margin-left:8px;">Fluxo de Trabalho Completo</span></div>
    <div style="padding:8px 0;">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;"><div style="background:#7c3aed;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:9pt;font-weight:700;flex-shrink:0;">1</div><div><strong>PLANEJAMENTO:</strong> Criar viagem com datas, modelo do ônibus e 3 valores (lotes).</div></div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;"><div style="background:#7c3aed;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:9pt;font-weight:700;flex-shrink:0;">2</div><div><strong>VENDAS:</strong> Adicionar passageiros, gerar contratos e enviar links de assinatura.</div></div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;"><div style="background:#7c3aed;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:9pt;font-weight:700;flex-shrink:0;">3</div><div><strong>ALOCAÇÃO:</strong> Atribuir poltronas no mapa de assentos para cada passageiro.</div></div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;"><div style="background:#7c3aed;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:9pt;font-weight:700;flex-shrink:0;">4</div><div><strong>FINANCEIRO:</strong> Acompanhar parcelas e registrar recebimentos regularmente.</div></div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;"><div style="background:#7c3aed;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:9pt;font-weight:700;flex-shrink:0;">5</div><div><strong>PRÉ-EMBARQUE:</strong> Imprimir lista de passageiros; conferir documentos e pagamentos.</div></div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;"><div style="background:#7c3aed;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:9pt;font-weight:700;flex-shrink:0;">6</div><div><strong>EMBARQUE:</strong> Usar Check-in para marcar passageiros conforme embarcam.</div></div>
      <div style="display:flex;gap:8px;align-items:center;"><div style="background:#16a34a;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:9pt;font-weight:700;flex-shrink:0;">7</div><div><strong>ENCERRAMENTO:</strong> Registrar despesas, gerar relatório de rentabilidade e arquivar.</div></div>
    </div>
  </div>
  <div class="dica"><strong>✅ Ordem certa:</strong> Crie viagem → adicione clientes → atribua assentos → gere contratos → acompanhe financeiro → faça check-in → encerre.</div>
  <div class="dica"><strong>✅ Grupos e cores:</strong> Organize famílias com grupos. A lista impressa ficará agrupada visualmente — facilita o embarque.</div>
  <div class="dica"><strong>✅ Calendário semanal:</strong> Revise toda segunda-feira para identificar parcelas vencendo na semana.</div>
  <div class="atencao"><strong>⚠️ Evite:</strong> Lançar pagamentos sem comprovante | Deixar passageiros sem poltrona no dia do embarque | Arquivar viagens sem fechar o financeiro.</div>
  <h3>🛠️ Logs de Auditoria</h3>
  <p>Em <strong>Logs de Auditoria</strong> no menu lateral, você vê todos os cadastros, edições e exclusões do sistema com data, hora e usuário responsável. Use para rastrear qualquer alteração.</p>
  <div class="rodape">
    <p><strong>Fly Turismo</strong> — Sistema de Gestão de Viagens</p>
    <p>Manual gerado em ${now} • Versão 1.0 • Confidencial — uso interno</p>
  </div>
</div>

</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

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
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="detalhes">Detalhes e Passageiros</TabsTrigger>
          <TabsTrigger value="lista-financeira">💲 Lista Financeira</TabsTrigger>
          <TabsTrigger value="despesas">💰 Despesas</TabsTrigger>
          <TabsTrigger value="documentos">Documentos da Viagem</TabsTrigger>
          <TabsTrigger value="manual">📖 Manual do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="despesas">
          <DespesasViagem viagemId={viagemId} />
        </TabsContent>

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

      {/* Contratos da viagem */}
      <Card className="shadow-lg">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-500" />
              Contratos desta Viagem ({contratos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {contratos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm">Nenhum contrato gerado para esta viagem ainda.</p>
              </div>
            )}
            {contratos.map((contrato) => {
              const linkAssinatura = contrato.link_assinatura
                ? `${window.location.origin}/AssinaturaContrato?token=${contrato.link_assinatura}`
                : null;
              const assinado = !!contrato.assinatura_nome;
              const isCopied = copiedId === contrato.id;

              return (
                <div
                  key={contrato.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    assinado ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10" : "border-border"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${assinado ? "bg-emerald-500" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{contrato.nome_completo}</p>
                    <p className="text-xs text-muted-foreground">
                      {assinado ? `✅ Assinado por ${contrato.assinatura_nome}` : "⏳ Aguardando assinatura"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {linkAssinatura && !assinado && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-2 gap-1 ${isCopied ? "text-emerald-600" : "text-muted-foreground hover:text-foreground"}`}
                          onClick={() => {
                            navigator.clipboard.writeText(linkAssinatura);
                            setCopiedId(contrato.id);
                            toast({ title: "✅ Link copiado!", description: "Cole no WhatsApp ou e-mail do cliente." });
                            setTimeout(() => setCopiedId(null), 2500);
                          }}
                          title="Copiar link de assinatura"
                        >
                          {isCopied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="text-xs">{isCopied ? "Copiado!" : "Copiar link"}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => setContratoQR({ ...contrato, link: linkAssinatura })}
                          title="Ver QR Code do link"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {assinado && (
                      <span className="text-xs text-emerald-600 font-medium px-2">✅ Assinado</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </TabsContent>


      <TabsContent value="lista-financeira">
        <Card className="shadow-lg">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Lista Financeira dos Passageiros ({clientes.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Resumo de Nome, CPF e Valor Pago de cada passageiro desta viagem.
                </p>
              </div>
              {clientes.length > 0 && (
                <Button onClick={imprimirListaFinanceira} variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimir Lista
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {clientes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>Nenhum passageiro cadastrado nesta viagem.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nº</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome Completo</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CPF</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor do Pacote</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Pago</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...clientes].sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || '')).map((cliente, index) => {
                      const valorPacote = cliente.valor_total_pacote || 0;
                      const valorPago = cliente.valor_pago || 0;
                      const saldo = valorPacote - valorPago;
                      return (
                        <tr key={cliente.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-sm text-muted-foreground font-medium">{index + 1}</td>
                          <td className="p-3 text-sm font-semibold text-foreground">{cliente.nome_completo}</td>
                          <td className="p-3 text-sm text-muted-foreground">{cliente.cpf || '-'}</td>
                          <td className="p-3 text-sm text-right text-foreground">
                            R$ {valorPacote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-sm text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            R$ {valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-sm text-right font-semibold ${saldo > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={
                              cliente.status_pagamento === 'Pago' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' :
                              cliente.status_pagamento === 'Parcial' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' :
                              'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                            }>
                              {cliente.status_pagamento || 'Pendente'}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10 h-8 px-2 gap-1"
                              onClick={() => {
                                setPagamentoCliente(cliente);
                                setPagamentoData({ valor: 0, forma_pagamento: 'PIX', data_pagamento: new Date().toISOString().split('T')[0], observacoes: '' });
                                setShowPagamentoForm(true);
                              }}
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Pagar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50 border-t-2 border-border">
                      <td colSpan={3} className="p-3 text-sm font-bold text-foreground">TOTAIS</td>
                      <td className="p-3 text-sm text-right font-bold text-foreground">
                        R$ {clientes.reduce((sum, c) => sum + (c.valor_total_pacote || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-sm text-right font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {clientes.reduce((sum, c) => sum + (c.valor_pago || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-sm text-right font-bold text-red-500">
                        R$ {clientes.reduce((sum, c) => sum + ((c.valor_total_pacote || 0) - (c.valor_pago || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
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

      <TabsContent value="manual">
        <Card className="shadow-lg">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-xl">
              📖 Manual Completo do Sistema
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gere e baixe o manual de instrução completo do sistema Fly Turismo com explicação de todos os módulos.
            </p>
          </CardHeader>
          <CardContent className="p-8 flex flex-col items-center gap-6">
            <div className="w-full max-w-lg text-center space-y-4">
              <div className="w-24 h-24 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-12 h-12 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Manual de Instrução</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                O manual cobre todos os módulos do sistema: Dashboard, Viagens, Passageiros, Assentos, Financeiro, 
                Contratos, Equipe, Check-in, Calendário, Fornecedores, Relatórios e Configurações. 
                Ideal para treinar novos funcionários ou consultar dúvidas.
              </p>
              <div className="grid grid-cols-2 gap-3 text-left mt-4">
                {[
                  "📊 Dashboard e Estatísticas",
                  "✈️ Gestão de Viagens",
                  "👥 Cadastro de Passageiros",
                  "💺 Mapa de Assentos",
                  "💰 Módulo Financeiro",
                  "📝 Contratos e Assinaturas",
                  "👨‍💼 Gestão de Equipe",
                  "🛂 Check-in e Embarque",
                  "📅 Calendário de Viagens",
                  "🏢 Fornecedores",
                  "📈 Relatórios e Exportação",
                  "⚙️ Configurações do Sistema",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white px-10 py-6 text-lg gap-3 shadow-lg"
              onClick={gerarManualPDF}
            >
              <Download className="w-6 h-6" />
              Baixar Manual em PDF
            </Button>
            <p className="text-xs text-muted-foreground">
              O manual será aberto em uma nova aba — use Ctrl+P (ou Cmd+P) para salvar como PDF.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      {/* Modal QR Code do contrato */}
      <QRDialog open={!!contratoQR} onOpenChange={() => setContratoQR(null)}>
        <QRDialogContent className="max-w-sm">
          <QRDialogHeader>
            <QRDialogTitle className="text-center text-foreground">QR Code — Assinatura</QRDialogTitle>
          </QRDialogHeader>
          {contratoQR && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-border">
                <QRCodeSVG value={contratoQR.link} size={200} level="H" includeMargin={false} />
              </div>
              <div className="text-center space-y-1 w-full">
                <p className="font-bold text-foreground">{contratoQR.nome_completo}</p>
                <p className="text-xs text-muted-foreground break-all">{contratoQR.link}</p>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(contratoQR.link);
                  toast({ title: "✅ Link copiado!" });
                }}
              >
                <Copy className="w-4 h-4" />
                Copiar Link
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Envie este QR Code ou o link para o cliente assinar o contrato digitalmente.
              </p>
            </div>
          )}
        </QRDialogContent>
      </QRDialog>

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