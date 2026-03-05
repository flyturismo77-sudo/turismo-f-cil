import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Armchair, User, X, Search, MapPin, Printer, Save, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DoubleDeckLayout from "../components/assentos/DoubleDeckLayout";
import DDDSTurLayout from "../components/assentos/DDDSTurLayout";
import DDJGTurismoLayout from "../components/assentos/DDJGTurismoLayout";
import JGTurismo44Layout from "../components/assentos/JGTurismo44Layout";
import LDDecaTurismoLayout from "../components/assentos/LDDecaTurismoLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Assentos() {
  const [selectedViagem, setSelectedViagem] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("mapa");
  const [selectedClientes, setSelectedClientes] = useState([]);
  const [mensagemGrupo, setMensagemGrupo] = useState("");
  const queryClient = useQueryClient();

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: () => base44.entities.Viagem.list(),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    enabled: !!selectedViagem,
  });

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const configs = await base44.entities.ConfiguracaoEmpresa.list();
      return configs[0];
    },
  });

  const { data: documentos = [] } = useQuery({
    queryKey: ['documentos-viagem', selectedViagem],
    queryFn: () => base44.entities.DocumentoViagem.filter({ id_viagem: selectedViagem }),
    enabled: !!selectedViagem,
  });

  const saveDocumentMutation = useMutation({
    mutationFn: (docData) => base44.entities.DocumentoViagem.create(docData),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentos-viagem']);
      alert("✅ Documento salvo com sucesso!");
    },
  });

  const updateClienteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      setShowDialog(false);
      setSelectedSeat(null);
      setSearchTerm("");
    },
  });

  const viagemSelecionada = viagens.find(v => v.id === selectedViagem);
  const clientesDaViagem = clientes.filter(c => c.id_viagem === selectedViagem);

  const totalAssentos = viagemSelecionada?.vagas_totais || 46;
  const assentos = Array.from({ length: totalAssentos }, (_, i) => i + 1);
  
  const clientePorPoltrona = {};
  const clientesSemAssento = [];
  
  clientesDaViagem.forEach(c => {
    if (c.poltrona) {
      clientePorPoltrona[c.poltrona] = c;
    } else if (!c.e_crianca_colo) {
      clientesSemAssento.push(c);
    }
  });

  const assentosOcupadosTotal = Object.keys(clientePorPoltrona).length;

  const handleAtribuirAssento = async (clienteId, poltrona) => {
    const cliente = clientes.find(c => c.id === clienteId);
    
    if (cliente.poltrona) {
      await updateClienteMutation.mutateAsync({
        id: clienteId,
        data: { ...cliente, poltrona: null, andar_onibus: null }
      });
    }

    let andar = 'Primeiro Andar';
    if (viagemSelecionada?.modelo_onibus === 'VA_TUR') {
      andar = poltrona <= 48 ? 'Piso Superior' : 'Piso Inferior';
    } else if (viagemSelecionada?.modelo_onibus === 'DD_DS_TUR') {
      andar = poltrona <= 44 ? 'Piso Superior' : 'Piso Inferior';
    }

    await updateClienteMutation.mutateAsync({
      id: clienteId,
      data: { ...cliente, poltrona: poltrona, andar_onibus: andar }
    });

    setShowDialog(false);
  };

  const handleRemoverAssento = async (cliente) => {
    if (confirm(`Deseja liberar o assento ${cliente.poltrona} de ${cliente.nome_completo}?`)) {
      await updateClienteMutation.mutateAsync({
        id: cliente.id,
        data: { ...cliente, poltrona: null, andar_onibus: null }
      });
    }
  };

  const generateDocumentHTML = () => {
    if (!viagemSelecionada) return "";
    
    const hoje = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    
    const logoSection = config?.logo_url 
      ? `<img src="${config.logo_url}" alt="Logo" style="height: 80px; object-fit: contain; display: block; margin: 0 auto 15px;" />`
      : `<div style="font-size: 32px; font-weight: bold; color: #0f172a; margin-bottom: 15px; text-align: center;">Fly Turismo</div>`;

    // Agrupar clientes para ordenação
    const clientesDaViagem = clientes.filter(c => c.id_viagem === selectedViagem);
    
    const comAssento = clientesDaViagem.filter(c => c.poltrona).sort((a, b) => a.poltrona - b.poltrona);
    const semAssento = clientesDaViagem.filter(c => !c.poltrona && !c.e_crianca_colo && !c.id_cliente_principal).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    const criancasColo = clientesDaViagem.filter(c => c.e_crianca_colo).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    const acompanhantesSemAssento = clientesDaViagem.filter(c => !c.poltrona && c.id_cliente_principal && !c.e_crianca_colo).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));

    const getCoresOrdem = (cor) => {
      const ordem = { vermelho: 1, azul: 2, verde: 3, amarelo: 4, roxo: 5, rosa: 6, laranja: 7, marrom: 8, cinza: 9, '': 10 };
      return ordem[cor] || 10;
    };

    const allPassengers = [
        ...comAssento,
        ...semAssento,
        ...criancasColo,
        ...acompanhantesSemAssento
    ].sort((a, b) => {
      const corCompare = getCoresOrdem(a?.cor_grupo || '') - getCoresOrdem(b?.cor_grupo || '');
      if (corCompare !== 0) return corCompare;
      
      const grupoCompare = (a?.numero_grupo || 1) - (b?.numero_grupo || 1);
      if (grupoCompare !== 0) return grupoCompare;
      
      return (a?.nome_completo || '').localeCompare(b?.nome_completo || '');
    });

    const getPassageiroTipo = (c) => {
       // Regra 1: Sem data / idade null -> ADULTO
       if (c.idade === null || c.idade === undefined || c.idade === '') return { label: "Adulto", class: "tag-adulto" };
       
       // Regra 3: <= 5 anos -> ISENTO
       if (c.idade <= 5) return { label: "Isento (0-5)", class: "tag-colo" }; // Using tag-colo for Isento as requested or close enough
       
       // Regra 2: 6-11 -> CRIANÇA
       if (c.idade >= 6 && c.idade <= 11) return { label: "Criança (6-11)", class: "tag-crianca" };
       
       // Regra 4: >= 12 -> ADULTO
       return { label: "Adulto", class: "tag-adulto" };
    };

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lista de Passageiros - ${viagemSelecionada.nome}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0f172a; padding-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .info-item { display: flex; flex-direction: column; }
          .info-label { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .info-value { font-size: 12px; color: #0f172a; font-weight: 600; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background-color: #0f172a; color: white; font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          
          .tag { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; display: inline-block; }
          .tag-adulto { background: #e2e8f0; color: #475569; }
          .tag-crianca { background: #fef9c3; color: #a16207; }
          .tag-colo { background: #f3e8ff; color: #7e22ce; }
          .tag-acomp { background: #dbeafe; color: #1e40af; }
          
          .seat-badge { font-weight: bold; font-size: 12px; color: #0f172a; }
          .no-seat { color: #ef4444; font-style: italic; font-size: 10px; }
          
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoSection}
          <h2 style="margin: 0 0 5px 0; color: #0f172a; font-size: 24px;">LISTA DE PASSAGEIROS</h2>
          <p style="margin: 0; color: #64748b;">${viagemSelecionada.nome} - ${viagemSelecionada.destino}</p>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Data de Saída</span>
            <span class="info-value">${format(new Date(viagemSelecionada.data_saida), "dd/MM/yyyy")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Modelo do Ônibus</span>
            <span class="info-value">${viagemSelecionada.modelo_onibus} (${viagemSelecionada.vagas_totais} lug.)</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total Passageiros</span>
            <span class="info-value">${clientesDaViagem.length}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Emissão</span>
            <span class="info-value">${hoje}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%">Nº</th>
              <th style="width: 5%">Grupo</th>
              <th style="width: 33%">Nome Completo</th>
              <th style="width: 14%">CPF</th>
              <th style="width: 11%">Tipo</th>
              <th style="width: 10%">Assento</th>
              <th style="width: 22%">Embarque</th>
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

    allPassengers.forEach((c, index) => {
      const prevCliente = index > 0 ? allPassengers[index - 1] : null;
      const isNewGroup = prevCliente && (
        prevCliente.cor_grupo !== c.cor_grupo || 
        prevCliente.numero_grupo !== c.numero_grupo
      );
      let { label: tipoLabel, class: tipoClass } = getPassageiroTipo(c);

      // Override for specific cases if needed, but respecting the "NOVA REGRA" priority
      // "Quando deve ser considerado ISENTO (criança de colo)... Idade 0 a 5 anos"
      
      // However, explicitly marked 'e_crianca_colo' implies Isento usually.
      if (c.e_crianca_colo) {
        tipoLabel = "Criança de Colo";
        tipoClass = "tag-colo";
      } else if (c.id_cliente_principal && tipoLabel === "Adulto") {
        // If it's an adult accompanist, maybe just label as Adult or Accompanist?
        // Keeping existing logic for accompanist label if it doesn't contradict age rules
        // But user said "Classificação correta" table.
        // Let's stick to the computed type based on age for consistency, 
        // unless Acompanhante is a relationship status, not an age status.
        // The user's table only has Adulto, Criança, Isento.
        // I will use the computed age type, but maybe append (Acomp) if needed?
        // For now, strictly following the age rules is safer.
        // But 'Acompanhante' label was useful. Let's keep it ONLY if Adult?
        // Actually, let's use the age classification as primary.
        // The old code had Acompanhante as a catch-all if id_cliente_principal existed.
        // I'll remove the explicit "Acompanhante" type override to strictly follow age rules,
        // or maybe display it differently. 
        // Let's prioritize the User's Table.
        // Table says: Sem data -> ADULTO. Idade >= 12 -> ADULTO. 6-11 -> CRIANÇA. 0-5 -> ISENTO.
        // So I will use that.
      }

      let assentoDisplay = `<span class="no-seat">Sem assento</span>`;
      if (c.poltrona) {
        assentoDisplay = `<span class="seat-badge">#${c.poltrona}</span>`;
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
            <td colspan="7" style="height: 3px; background: linear-gradient(to right, transparent, #cbd5e1, transparent); padding: 0;"></td>
          </tr>
        `;
      }

      html += `
        <tr>
          <td style="text-align: center; font-weight: bold; color: #64748b;">${index + 1}</td>
          <td style="text-align: center;">${corBolinha}</td>
          <td style="font-weight: 600; color: #1e293b;">${(c?.nome_completo || '').toUpperCase()}</td>
          <td>${c?.cpf || '-'}</td>
          <td><span class="tag ${tipoClass}">${tipoLabel}</span></td>
          <td style="text-align: center;">${assentoDisplay}</td>
          <td>${c?.local_embarque || '-'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 15px 30px; background: #0f172a; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            🖨️ IMPRIMIR LISTA
          </button>
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const imprimirLista = () => {
    const html = generateDocumentHTML();
    if (!html) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.body.innerHTML += `
      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="padding: 15px 30px; background: #0f172a; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          🖨️ IMPRIMIR LISTA
        </button>
      </div>
    `;
    printWindow.document.close();
  };

  const salvarDocumento = async () => {
    const html = generateDocumentHTML();
    if (!html) return;

    const blob = new Blob([html], { type: 'text/html' });
    const fileName = `Lista-Assentos-${viagemSelecionada.nome.replace(/[^a-z0-9]/gi, '_')}.html`;
    const file = new File([blob], fileName, { type: 'text/html' });

    const { file_url } = await base44.integrations.Core.UploadFile({ file: file });
    
    await saveDocumentMutation.mutateAsync({
      nome: fileName,
      url: file_url,
      tipo: 'Lista de Assentos',
      id_viagem: viagemSelecionada.id,
      tamanho: blob.size
    });
  };

  const renderSeatInfo = (cliente) => {
    if (!cliente) return null;
    
    return (
      <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl min-w-48 pointer-events-none">
        <div className="space-y-1">
          <p className="font-bold text-sm">{cliente.nome_completo}</p>
          <p className="text-gray-300">CPF: {cliente.cpf}</p>
          <p className="text-gray-300">📱 {cliente.telefone}</p>
          {cliente.local_embarque && (
            <p className="text-gray-300 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {cliente.local_embarque}
            </p>
          )}
          <p className="text-sky-300 font-medium">Poltrona #{cliente.poltrona}</p>
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </div>
    );
  };

  const renderSeatsLayout = () => {
    const rows = [];
    let currentIndex = 0;
    
    while (currentIndex < assentos.length) {
      // Correct: Left = 1(janela), 2(corredor) | corridor | 4(corredor), 3(janela)
      const leftSeats = [
        assentos[currentIndex],     // ímpar - janela
        assentos[currentIndex + 1]  // par - corredor
      ].filter(Boolean);
      
      const rightSeats = [
        assentos[currentIndex + 3], // par - corredor
        assentos[currentIndex + 2]  // ímpar - janela
      ].filter(Boolean);
      
      rows.push({ left: leftSeats, right: rightSeats });
      currentIndex += 4;
    }
    
    return rows;
  };

  const seatRows = renderSeatsLayout();
  const isDoubleDeck = viagemSelecionada?.modelo_onibus === 'VA_TUR';
  const isDDDSTur = viagemSelecionada?.modelo_onibus === 'DD_DS_TUR';
  const isJGTurismo = viagemSelecionada?.modelo_onibus === 'JG_TURISMO_44';
  const isLDDeca = viagemSelecionada?.modelo_onibus === 'LD48';

  const enviarWhatsApp = (cliente) => {
    if (!cliente.telefone) {
      alert('Cliente não possui telefone cadastrado!');
      return;
    }
    const telefone = cliente.telefone.replace(/\D/g, '');
    const numero = telefone.startsWith('55') ? telefone : `55${telefone}`;
    const mensagem = `Olá ${cliente.nome_completo}! 
    
📌 Informações da sua viagem:
🚌 ${viagemSelecionada?.nome} - ${viagemSelecionada?.destino}
📅 Saída: ${format(new Date(viagemSelecionada?.data_saida), "dd/MM/yyyy")}
${cliente.poltrona ? `🪑 Poltrona: #${cliente.poltrona}` : '⚠️ Assento ainda não definido'}
${cliente.local_embarque ? `📍 Embarque: ${cliente.local_embarque}` : ''}

Qualquer dúvida, estamos à disposição!`;
    
    const url = `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const toggleClienteSelection = (clienteId) => {
    setSelectedClientes(prev => 
      prev.includes(clienteId) 
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  const enviarWhatsAppGrupo = () => {
    if (selectedClientes.length === 0) {
      alert('Selecione pelo menos um cliente!');
      return;
    }

    const mensagemBase = mensagemGrupo || `Olá! 
    
📌 Informações da viagem:
🚌 ${viagemSelecionada?.nome} - ${viagemSelecionada?.destino}
📅 Saída: ${format(new Date(viagemSelecionada?.data_saida), "dd/MM/yyyy")}

Qualquer dúvida, estamos à disposição!`;

    selectedClientes.forEach(clienteId => {
      const cliente = clientesDaViagem.find(c => c.id === clienteId);
      if (cliente?.telefone) {
        const telefone = cliente.telefone.replace(/\D/g, '');
        const numero = telefone.startsWith('55') ? telefone : `55${telefone}`;
        const mensagemPersonalizada = `Olá ${cliente.nome_completo}!\n\n${mensagemBase}${cliente.poltrona ? `\n🪑 Sua poltrona: #${cliente.poltrona}` : ''}`;
        const url = `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagemPersonalizada)}`;
        window.open(url, '_blank');
      }
    });

    setSelectedClientes([]);
    setMensagemGrupo("");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mapa de Assentos</h1>
        <p className="text-gray-500 mt-1">Atribua assentos aos clientes manualmente</p>
      </div>

      <Card className="shadow-lg border-none">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Selecione uma Viagem</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedViagem} onValueChange={setSelectedViagem}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Escolha uma viagem" />
                </SelectTrigger>
                <SelectContent>
                  {viagens.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nome} - {v.destino}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedViagem && (
                <>
                  <Button
                    onClick={imprimirLista}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Imprimir
                  </Button>
                  <Button
                    onClick={salvarDocumento}
                    variant="outline"
                    className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Salvar Documento
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {selectedViagem && (
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="mapa" className="flex items-center gap-2">
                  <Armchair className="w-4 h-4" />
                  Mapa de Assentos
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Web
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mapa" className="mt-0">
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 border-2 border-green-500 rounded-lg" />
                  <span className="text-sm text-gray-600">Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 border-2 border-gray-300 rounded-lg" />
                  <span className="text-sm text-gray-600">Disponível</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    <Armchair className="w-4 h-4 mr-2" />
                    {assentosOcupadosTotal}/{totalAssentos} ocupados
                  </Badge>
                  {clientesSemAssento.length > 0 && (
                    <Badge variant="outline" className="text-lg px-4 py-2 bg-orange-50">
                      <User className="w-4 h-4 mr-2" />
                      {clientesSemAssento.length} sem assento
                    </Badge>
                  )}
                  <Progress value={(assentosOcupadosTotal / totalAssentos) * 100} className="w-32 h-3" />
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nome, CPF ou poltrona..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLDDeca ? (
              <LDDecaTurismoLayout
                clientePorPoltrona={clientePorPoltrona}
                searchTerm={searchTerm}
                onSeatClick={(seatNumber) => {
                  setSelectedSeat(seatNumber);
                  setShowDialog(true);
                }}
                renderSeatInfo={renderSeatInfo}
              />
            ) : isJGTurismo ? (
              <JGTurismo44Layout
                clientePorPoltrona={clientePorPoltrona}
                searchTerm={searchTerm}
                onSeatClick={(seatNumber) => {
                  setSelectedSeat(seatNumber);
                  setShowDialog(true);
                }}
                renderSeatInfo={renderSeatInfo}
              />
            ) : isDDDSTur ? (
              <DDDSTurLayout
                clientePorPoltrona={clientePorPoltrona}
                searchTerm={searchTerm}
                onSeatClick={(seatNumber) => {
                  setSelectedSeat(seatNumber);
                  setShowDialog(true);
                }}
                renderSeatInfo={renderSeatInfo}
              />
            ) : isDoubleDeck ? (
              <DoubleDeckLayout
                clientePorPoltrona={clientePorPoltrona}
                searchTerm={searchTerm}
                onSeatClick={(seatNumber) => {
                  setSelectedSeat(seatNumber);
                  setShowDialog(true);
                }}
                renderSeatInfo={renderSeatInfo}
              />
            ) : (
              <div className="bg-gradient-to-b from-gray-100 to-gray-50 p-8 rounded-2xl">
                <div className="text-center mb-6">
                  <div className="inline-block bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold mb-2">
                    MOTORISTA
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {assentosOcupadosTotal} de {assentos.length} ocupados
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                  {seatRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-4 items-center">
                      <div className="flex gap-2 flex-1 justify-end">
                        {row.left.map((seatNumber) => {
                          const cliente = clientePorPoltrona[seatNumber];
                          const isOccupied = !!cliente;
                          const matchesSearch = !searchTerm || 
                            (cliente && (
                              cliente.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              cliente.cpf?.includes(searchTerm) ||
                              (cliente.poltrona && cliente.poltrona.toString().includes(searchTerm))
                            )) || 
                            (!isOccupied && seatNumber.toString().includes(searchTerm));

                          return (
                            <div key={seatNumber} className="relative group">
                              <button
                                onClick={() => {
                                  setSelectedSeat(seatNumber);
                                  setShowDialog(true);
                                }}
                                title={isOccupied ? cliente.nome_completo : `Poltrona ${seatNumber} disponível - Clique para atribuir`}
                                className={`
                                  w-16 h-16 rounded-xl border-2 transition-all duration-200
                                  flex flex-col items-center justify-center p-2 relative
                                  ${isOccupied 
                                    ? 'bg-green-100 border-green-500 hover:bg-green-200' 
                                    : 'bg-white border-gray-300 hover:bg-sky-100 hover:border-sky-500'
                                  }
                                  ${!matchesSearch && searchTerm ? 'opacity-30' : ''}
                                `}
                              >
                                <Armchair className={`w-5 h-5 mb-1 ${isOccupied ? 'text-green-700' : 'text-gray-400'}`} />
                                <span className="text-xs font-bold text-gray-700">{seatNumber}</span>
                                <span className="text-[8px] text-gray-500">{seatNumber % 2 === 1 ? 'JANELA' : 'CORRED.'}</span>
                              </button>
                              {isOccupied && (
                                <div className="hidden group-hover:block">
                                  {renderSeatInfo(cliente)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="w-12 flex-shrink-0 border-x-4 border-dashed border-gray-300 h-16 flex items-center justify-center">
                        <span className="text-xs text-gray-400 rotate-90">CORREDOR</span>
                      </div>

                      <div className="flex gap-2 flex-1">
                        {row.right.map((seatNumber) => {
                          const cliente = clientePorPoltrona[seatNumber];
                          const isOccupied = !!cliente;
                          const matchesSearch = !searchTerm || 
                            (cliente && (
                              cliente.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              cliente.cpf?.includes(searchTerm) ||
                              (cliente.poltrona && cliente.poltrona.toString().includes(searchTerm))
                            )) || 
                            (!isOccupied && seatNumber.toString().includes(searchTerm));

                          return (
                            <div key={seatNumber} className="relative group">
                              <button
                                onClick={() => {
                                  setSelectedSeat(seatNumber);
                                  setShowDialog(true);
                                }}
                                title={isOccupied ? cliente.nome_completo : `Poltrona ${seatNumber} disponível - Clique para atribuir`}
                                className={`
                                  w-16 h-16 rounded-xl border-2 transition-all duration-200
                                  flex flex-col items-center justify-center p-2 relative
                                  ${isOccupied 
                                    ? 'bg-green-100 border-green-500 hover:bg-green-200' 
                                    : 'bg-white border-gray-300 hover:bg-sky-100 hover:border-sky-500'
                                  }
                                  ${!matchesSearch && searchTerm ? 'opacity-30' : ''}
                                `}
                              >
                                <Armchair className={`w-5 h-5 mb-1 ${isOccupied ? 'text-green-700' : 'text-gray-400'}`} />
                                <span className="text-xs font-bold text-gray-700">{seatNumber}</span>
                                <span className="text-[8px] text-gray-500">{seatNumber % 2 === 1 ? 'JANELA' : 'CORRED.'}</span>
                              </button>
                              {isOccupied && (
                                <div className="hidden group-hover:block">
                                  {renderSeatInfo(cliente)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clientesSemAssento.length > 0 && (
              <div className="mt-6 bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Passageiros Sem Assento ({clientesSemAssento.length})
                </h3>
                <p className="text-sm text-orange-700 mb-4">
                  ℹ️ Clique em um assento vazio no mapa acima para atribuí-lo a um destes clientes
                </p>
                <div className="space-y-2">
                  {clientesSemAssento.map(cliente => (
                    <div key={cliente.id} className="bg-white rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{cliente.nome_completo}</p>
                        <p className="text-sm text-gray-600">
                          CPF: {cliente.cpf} | Tel: {cliente.telefone || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </TabsContent>

              <TabsContent value="whatsapp" className="mt-0">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">WhatsApp Web Integrado</h3>
                        <p className="text-sm text-gray-600">Envie mensagens diretamente para seus clientes</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3">📝 Mensagem Personalizada para Grupo</h4>
                      <textarea
                        value={mensagemGrupo}
                        onChange={(e) => setMensagemGrupo(e.target.value)}
                        placeholder="Digite uma mensagem personalizada para enviar a múltiplos clientes..."
                        className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-sm text-gray-600">
                          {selectedClientes.length} cliente(s) selecionado(s)
                        </p>
                        <Button
                          onClick={enviarWhatsAppGrupo}
                          disabled={selectedClientes.length === 0}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Enviar para Selecionados
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Buscar cliente por nome, CPF ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid gap-3">
                    {clientesDaViagem
                      .filter(cliente => {
                        if (!searchTerm) return true;
                        const search = searchTerm.toLowerCase();
                        return (
                          cliente.nome_completo?.toLowerCase().includes(search) ||
                          cliente.cpf?.includes(search) ||
                          cliente.telefone?.includes(search)
                        );
                      })
                      .map(cliente => (
                        <div
                          key={cliente.id}
                          className={`bg-white rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                            selectedClientes.includes(cliente.id)
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedClientes.includes(cliente.id)}
                                onChange={() => toggleClienteSelection(cliente.id)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">{cliente.nome_completo}</h4>
                                  {cliente.poltrona && (
                                    <Badge variant="outline" className="text-xs">
                                      <Armchair className="w-3 h-3 mr-1" />
                                      #{cliente.poltrona}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                                  <span>📱 {cliente.telefone || 'Sem telefone'}</span>
                                  <span>CPF: {cliente.cpf}</span>
                                  {cliente.local_embarque && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {cliente.local_embarque}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => enviarWhatsApp(cliente)}
                              disabled={!cliente.telefone}
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Enviar
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}

        {!selectedViagem && (
          <CardContent className="p-12 text-center text-gray-500">
            <Armchair className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Selecione uma viagem para visualizar e gerenciar os assentos</p>
          </CardContent>
        )}
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Poltrona #{selectedSeat}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSeat && clientePorPoltrona[selectedSeat] ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-green-700" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {clientePorPoltrona[selectedSeat].nome_completo}
                    </p>
                    <p className="text-sm text-gray-600">
                      {clientePorPoltrona[selectedSeat].telefone}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemoverAssento(clientePorPoltrona[selectedSeat])}
                >
                  <X className="w-4 h-4 mr-2" />
                  Liberar Poltrona
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Selecione um cliente para ocupar a poltrona #{selectedSeat}:
                </p>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar cliente por nome, CPF ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {clientesSemAssento
                    .filter(c => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return c.nome_completo?.toLowerCase().includes(term) ||
                        c.cpf?.includes(term) ||
                        c.telefone?.includes(term);
                    })
                    .map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => handleAtribuirAssento(cliente.id, selectedSeat)}
                      className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-sky-50 hover:border-sky-500 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{cliente.nome_completo}</p>
                      <p className="text-sm text-gray-600">{cliente.telefone}</p>
                    </button>
                  ))}
                  {clientesSemAssento.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Todos os clientes já possuem poltronas ou são crianças de colo
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}