import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Hotel, Plus, Bed, Edit, Trash2, UserPlus, UserMinus, Printer, Save, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const capacidadesPorTipo = {
  "Simples": 1,
  "Duplo": 2,
  "Triplo": 3,
  "Quádruplo": 4,
  "Quíntuplo": 5,
  "Sêxtuplo": 6
};

const getNomeTipoQuarto = (capacidade) => {
  switch(capacidade) {
    case 1: return 'Quarto Individual';
    case 2: return 'Quarto Duplo';
    case 3: return 'Quarto Triplo';
    case 4: return 'Quarto Quádruplo';
    case 5: return 'Quarto Quíntuplo';
    case 6: return 'Quarto Sêxtuplo';
    default: return `Quarto (${capacidade} pessoas)`;
  }
};

export default function MapaQuartos() {
  const [selectedViagem, setSelectedViagem] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuartoForm, setShowQuartoForm] = useState(false);
  const [showOcupacaoDialog, setShowOcupacaoDialog] = useState(false);
  const [selectedQuarto, setSelectedQuarto] = useState(null);
  const [editingQuarto, setEditingQuarto] = useState(null); // New state variable
  const [formData, setFormData] = useState({
    numero_quarto: '',
    tipo: 'Duplo',
    camas_casal: 0,
    camas_solteiro: 0,
    camas_beliche: 0,
    camas_extra: 0
  });

  const queryClient = useQueryClient();

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: () => base44.entities.Viagem.list(),
  });

  const { data: quartos = [] } = useQuery({
    queryKey: ['quartos', selectedViagem],
    queryFn: () => base44.entities.Quarto.filter({ id_viagem: selectedViagem }),
    enabled: !!selectedViagem,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes', selectedViagem],
    queryFn: () => base44.entities.Cliente.filter({ id_viagem: selectedViagem }),
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

  const createQuartoMutation = useMutation({
    mutationFn: (data) => base44.entities.Quarto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['quartos']);
      setShowQuartoForm(false);
      setFormData({ numero_quarto: '', tipo: 'Duplo' });
    },
  });

  const updateQuartoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quarto.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['quartos']);
      setEditingQuarto(null); // New: Reset editingQuarto state
    },
  });

  const deleteQuartoMutation = useMutation({
    mutationFn: (id) => base44.entities.Quarto.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['quartos']);
    },
  });

  const updateClienteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['quartos']);
    },
  });

  const handleSubmitQuarto = (e) => {
    e.preventDefault();
    const capacidade = capacidadesPorTipo[formData.tipo];
    
    // Validar configuração de camas
    const totalCamas = (formData.camas_casal * 2) + formData.camas_solteiro + (formData.camas_beliche * 2) + formData.camas_extra;
    
    if (totalCamas !== capacidade) {
      alert(`⚠️ A soma das camas (${totalCamas} pessoas) não corresponde à capacidade do quarto (${capacidade} pessoas).\n\n` +
        `Configuração atual:\n` +
        `• ${formData.camas_casal} cama(s) de casal = ${formData.camas_casal * 2} pessoas\n` +
        `• ${formData.camas_solteiro} cama(s) de solteiro = ${formData.camas_solteiro} pessoa(s)\n` +
        `• ${formData.camas_beliche} beliche(s) = ${formData.camas_beliche * 2} pessoas\n` +
        `• ${formData.camas_extra} cama(s) extra = ${formData.camas_extra} pessoa(s)\n\n` +
        `Por favor, ajuste a configuração para totalizar exatamente ${capacidade} pessoas.`);
      return;
    }
    
    if (editingQuarto) {
      const hospedes = clientesDoQuarto(editingQuarto.id);
      updateQuartoMutation.mutate({
        id: editingQuarto.id,
        data: {
          ...editingQuarto,
          numero_quarto: formData.numero_quarto,
          capacidade: capacidade,
          camas_casal: formData.camas_casal,
          camas_solteiro: formData.camas_solteiro,
          camas_beliche: formData.camas_beliche,
          camas_extra: formData.camas_extra
        }
      });
      setShowQuartoForm(false);
      setEditingQuarto(null);
      setFormData({ numero_quarto: '', tipo: 'Duplo', camas_casal: 0, camas_solteiro: 0, camas_beliche: 0, camas_extra: 0 });
    } else {
      createQuartoMutation.mutate({
        ...formData,
        id_viagem: selectedViagem,
        capacidade,
        ocupados: 0
      });
      setShowQuartoForm(false);
      setFormData({ numero_quarto: '', tipo: 'Duplo', camas_casal: 0, camas_solteiro: 0, camas_beliche: 0, camas_extra: 0 });
    }
  };

  const handleDeleteQuarto = async (quarto) => {
    if (confirm(`Tem certeza que deseja excluir o quarto ${quarto.numero_quarto}? Os hóspedes serão desvinculados, mas continuarão na viagem.`)) {
      const hospedes = clientesDoQuarto(quarto.id);
      
      if (hospedes.length > 0) {
        await Promise.all(hospedes.map(h => 
          updateClienteMutation.mutateAsync({
            id: h.id,
            data: { ...h, id_quarto: null }
          })
        ));
      }
      
      deleteQuartoMutation.mutate(quarto.id);
    }
  };

  const handleEditQuarto = (quarto) => {
    setEditingQuarto(quarto);
    const hospedes = clientesDoQuarto(quarto.id);
    const tipoReverso = Object.entries(capacidadesPorTipo).find(([key, val]) => val === quarto.capacidade)?.[0] || 'Duplo';
    
    setFormData({
      numero_quarto: quarto.numero_quarto,
      tipo: tipoReverso,
      camas_casal: quarto.camas_casal || 0,
      camas_solteiro: quarto.camas_solteiro || 0,
      camas_beliche: quarto.camas_beliche || 0,
      camas_extra: quarto.camas_extra || 0
    });
    setShowQuartoForm(true);
  };

  const generateQuartosDocumentHTML = () => {
    try {
      if (!selectedViagem) return "";
      
      const viagemSelecionada = viagens.find(v => v.id === selectedViagem);
      if (!viagemSelecionada) return "";

      const hoje = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      
      const logoSection = config?.logo_url 
        ? `<img src="${config.logo_url}" alt="Logo" class="logo" />`
        : `<div style="font-size: 60px; margin: 0 auto 15px;">🏨</div>`;
      
      const totalVagas = quartos.reduce((sum, q) => sum + (Number(q.capacidade) || 0), 0);
      
      const clientesDoQuartoSafe = (quartoId) => {
        return clientes.filter(c => c.id_quarto === quartoId);
      };

      const totalOcupados = quartos.reduce((sum, q) => sum + clientesDoQuartoSafe(q.id).length, 0);
      
      // Construção segura da tabela de quartos
      let tableRows = '';
      
      // Ordenar quartos por nome/número
      const quartosOrdenados = [...quartos].sort((a, b) => {
        const numA = parseInt(a.numero_quarto?.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.numero_quarto?.replace(/\D/g, '')) || 0;
        return numA - numB || (a.numero_quarto || '').localeCompare(b.numero_quarto || '');
      });

      quartosOrdenados.forEach((quarto, quartoIndex) => {
        if (!quarto) return;

        const hospedes = clientesDoQuartoSafe(quarto.id);
        const tipoQuarto = getNomeTipoQuarto(Number(quarto.capacidade) || 0);
        
        const coresHex = {
          vermelho: '#ef4444',
          azul: '#3b82f6',
          verde: '#10b981',
          amarelo: '#eab308',
          roxo: '#a855f7',
          rosa: '#ec4899',
          laranja: '#f97316',
          marrom: '#92400e',
          cinza: '#6b7280'
        };

        const getCorHex = (cor, grupo) => {
          if (!cor) return null;
          const numGrupo = grupo || 1;
          const coresMap = {
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
          return coresMap[cor]?.[grupoIndex] || coresMap[cor]?.[0];
        };
        
        let hospedesHtml = '';
        if (hospedes && hospedes.length > 0) {
            hospedesHtml = `<ul class="hospedes-lista">
              ${hospedes.map((h, hIndex) => {
                  const nome = h?.nome_completo || 'Sem Nome';
                  const cpf = h?.cpf || '-';
                  const corHex = getCorHex(h?.cor_grupo, h?.numero_grupo);
                  const corBolinha = corHex
                    ? `<div style="display: inline-flex; align-items: center; gap: 3px; margin-right: 6px; vertical-align: middle;">
                         <div style="width: 14px; height: 14px; border-radius: 50%; background: ${corHex}; display: inline-block; border: 2px solid #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.2);"></div>
                         <span style="font-size: 9px; font-weight: bold; color: #64748b;">G${h.numero_grupo || 1}</span>
                       </div>`
                    : '';
                  
                  return `
                    <li style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #eee;">
                      <div style="font-weight: bold; color: #1f2937;">${corBolinha}${hIndex + 1}. ${nome.toUpperCase()}</div>
                      <div style="font-size: 11px; color: #6b7280; padding-left: 20px;">
                        <span>CPF: ${cpf}</span>
                      </div>
                    </li>`;
              }).join('')}
            </ul>`;
        } else {
            hospedesHtml = '<span class="vazio">Nenhum hóspede</span>';
        }

        const camasInfo = [];
        if (quarto.camas_casal > 0) camasInfo.push(`${quarto.camas_casal} casal`);
        if (quarto.camas_solteiro > 0) camasInfo.push(`${quarto.camas_solteiro} solteiro`);
        if (quarto.camas_beliche > 0) camasInfo.push(`${quarto.camas_beliche} beliche`);
        if (quarto.camas_extra > 0) camasInfo.push(`${quarto.camas_extra} extra`);
        const camasText = camasInfo.length > 0 ? `<div style="font-size: 10px; color: #0369a1; margin-top: 3px;">🛏️ ${camasInfo.join(', ')}</div>` : '';

        tableRows += `
          <tr>
            <td style="vertical-align: top; text-align: center; font-weight: bold; color: #64748b;">
                ${quartoIndex + 1}
            </td>
            <td style="vertical-align: top;">
                <span class="quarto-numero">Quarto ${quarto.numero_quarto || 'S/N'}</span>
            </td>
            <td style="vertical-align: top;">
                <span class="tipo-badge">${tipoQuarto}</span>
                ${camasText}
            </td>
            <td style="vertical-align: top;">
                <span class="ocupacao">${hospedes.length} / ${quarto.capacidade || 0}</span>
            </td>
            <td style="vertical-align: top;">
              ${hospedesHtml}
            </td>
          </tr>
        `;
      });

      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lista de Quartos - ${viagemSelecionada.nome || 'Viagem'}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 30px;
              background: #f5f5f5;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #f59e0b;
            }
            .header h1 { 
              color: #d97706; 
              margin: 10px 0;
              font-size: 28px;
              text-transform: uppercase;
            }
            .logo {
              max-width: 120px;
              max-height: 80px;
              margin: 0 auto 15px;
              display: block;
              object-fit: contain;
            }
            .info-box { 
              background: #fff; 
              padding: 20px; 
              border-radius: 8px;
              margin: 20px 0;
              border-left: 5px solid #f59e0b;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .info-box p { 
              margin: 6px 0; 
              font-size: 14px;
              color: #555;
            }
            .info-box strong {
                color: #333;
            }
            .resumo {
              display: flex;
              justify-content: space-between;
              margin: 25px 0;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .resumo-item {
              text-align: center;
              flex: 1;
              border-right: 1px solid #eee;
            }
            .resumo-item:last-child {
                border-right: none;
            }
            .resumo-item .numero {
              font-size: 24px;
              font-weight: bold;
              color: #d97706;
            }
            .resumo-item .label {
              font-size: 12px;
              color: #78350f;
              margin-top: 5px;
              text-transform: uppercase;
              font-weight: 600;
            }
            table { 
              width: 100%; 
              border-collapse: separate;
              border-spacing: 0;
              margin-top: 20px;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            th, td { 
              padding: 15px; 
              text-align: left;
              border-bottom: 1px solid #f3f4f6;
            }
            th { 
              background: #f59e0b;
              color: white;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 0.5px;
            }
            tr:last-child td {
                border-bottom: none;
            }
            tr:nth-child(even) { 
              background: #fdf8f6;
            }
            .quarto-numero {
              font-weight: bold;
              font-size: 16px;
              color: #92400e;
            }
            .tipo-badge {
              display: inline-block;
              padding: 4px 10px;
              background: #fff7ed;
              color: #9a3412;
              border: 1px solid #fed7aa;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
            }
            .ocupacao {
              font-weight: 600;
              color: #0369a1;
              background: #e0f2fe;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
            }
            .hospedes-lista {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .vazio {
              color: #9ca3af;
              font-style: italic;
              font-size: 13px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #9ca3af;
              font-size: 11px;
            }
            @media print {
              body { background: white; padding: 0; }
              button { display: none !important; }
              .info-box, .resumo, table { box-shadow: none; border: 1px solid #eee; }
              .header { border-bottom: 2px solid #f59e0b; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoSection}
            <h1>LISTA DE QUARTOS</h1>
            <p style="color: #555; font-size: 16px; margin: 5px 0;">${viagemSelecionada.nome || ''}</p>
            <p style="color: #888; font-size: 12px; margin-top: 5px;">${viagemSelecionada.destino || ''}</p>
          </div>

          <div class="resumo">
            <div class="resumo-item">
              <div class="numero">${quartos.length}</div>
              <div class="label">Total de Quartos</div>
            </div>
            <div class="resumo-item">
              <div class="numero">${totalVagas}</div>
              <div class="label">Capacidade Total</div>
            </div>
            <div class="resumo-item">
              <div class="numero">${totalOcupados}</div>
              <div class="label">Hóspedes</div>
            </div>
            <div class="resumo-item">
              <div class="numero">${totalVagas > 0 ? Math.round((totalOcupados / totalVagas) * 100) : 0}%</div>
              <div class="label">Ocupação</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">Nº</th>
                <th style="width: 13%">Quarto</th>
                <th style="width: 20%">Tipo e Camas</th>
                <th style="width: 10%">Ocupação</th>
                <th style="width: 52%">Hóspedes (Nome / CPF)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            <p><strong>${config?.nome_empresa || 'Fly Turismo'}</strong> - ${config?.slogan || ''}</p>
            <p>Relatório gerado em: ${hoje}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #f59e0b; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              🖨️ Imprimir Lista
            </button>
          </div>
        </body>
        </html>
      `;
      
      return html;
    } catch (error) {
      console.error("Erro crítico ao gerar impressão:", error);
      return "";
    }
  };

  const imprimirListaQuartos = () => {
    const html = generateQuartosDocumentHTML();
    if (!html) {
      alert("Erro ao gerar a lista de impressão.");
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.body.innerHTML += `
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="padding: 12px 24px; background: #f59e0b; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          🖨️ Imprimir Lista
        </button>
      </div>
    `;
    printWindow.document.close();
  };

  const salvarDocumentoQuartos = async () => {
    const html = generateQuartosDocumentHTML();
    if (!html) return;

    const blob = new Blob([html], { type: 'text/html' });
    const viagemSelecionada = viagens.find(v => v.id === selectedViagem);
    const fileName = `Lista-Quartos-${viagemSelecionada.nome.replace(/[^a-z0-9]/gi, '_')}.html`;
    const file = new File([blob], fileName, { type: 'text/html' });

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: file });

      await saveDocumentMutation.mutateAsync({
        nome: fileName,
        url: file_url,
        tipo: 'Lista de Quartos',
        id_viagem: selectedViagem,
      });
    } catch (error) {
      console.error('Erro ao salvar lista de quartos:', error);
      alert('Erro ao salvar documento de quartos. Tente novamente.');
    }
  };

  const handleAdicionarHospede = async (clienteId, quarto) => {
    const hospedes = clientesDoQuarto(quarto.id);
    if (hospedes.length >= 6) {
      alert("⚠️ Limite máximo atingido! Cada quarto pode ter no máximo 6 pessoas.");
      return;
    }
    if (hospedes.length >= quarto.capacidade) {
      alert("Quarto cheio! Não é possível adicionar mais hóspedes.");
      return;
    }

    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente.id_quarto) {
      const quartoAntigo = quartos.find(q => q.id === cliente.id_quarto);
      if (quartoAntigo) {
        await updateQuartoMutation.mutateAsync({
          id: quartoAntigo.id,
          data: { ...quartoAntigo, ocupados: Math.max(0, quartoAntigo.ocupados - 1) }
        });
      }
    }

    await updateClienteMutation.mutateAsync({
      id: clienteId,
      data: { ...cliente, id_quarto: quarto.id }
    });

    await updateQuartoMutation.mutateAsync({
      id: quarto.id,
      data: { ...quarto, ocupados: quarto.ocupados + 1 }
    });

    setShowOcupacaoDialog(false);
  };

  const handleRemoverHospede = async (cliente, quarto) => {
    await updateClienteMutation.mutateAsync({
      id: cliente.id,
      data: { ...cliente, id_quarto: null }
    });

    await updateQuartoMutation.mutateAsync({
      id: quarto.id,
      data: { ...quarto, ocupados: Math.max(0, quarto.ocupados - 1) }
    });
  };

  const clientesDoQuarto = (quartoId) => {
    return clientes.filter(c => c.id_quarto === quartoId);
  };

  const clientesSemQuarto = clientes.filter(c => !c.id_quarto);

  const totalQuartos = quartos.length;
  const totalVagas = quartos.reduce((sum, q) => sum + q.capacidade, 0);
  const totalOcupados = quartos.reduce((sum, q) => sum + clientesDoQuarto(q.id).length, 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mapa de Quartos</h1>
        <p className="text-gray-500 mt-1">Gerencie a acomodação dos clientes no hotel</p>
      </div>

      <Card className="shadow-lg border-none">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Selecione uma Viagem</CardTitle>
            <div className="flex gap-2"> {/* Added div for grouping Select and Print Button */}
              <Select value={selectedViagem} onValueChange={setSelectedViagem}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Escolha uma viagem" />
                </SelectTrigger>
                <SelectContent>
                  {viagens.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.nome} - {v.destino}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedViagem && (
                <>
                  <Button
                    onClick={imprimirListaQuartos}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Imprimir
                  </Button>
                  <Button
                    onClick={salvarDocumentoQuartos}
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
          <>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Total de Quartos</p>
                    <p className="text-2xl font-bold text-gray-900">{totalQuartos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ocupação</p>
                    <p className="text-2xl font-bold text-sky-600">
                      {totalVagas > 0 ? `${totalOcupados}/${totalVagas}` : '0/0'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {totalVagas > 0 && <Progress value={(totalOcupados / totalVagas) * 100} className="w-32 h-3" />}
                  </div>
                </div>
                <Button
                  onClick={() => setShowQuartoForm(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Quarto
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar cliente por nome, CPF ou número do quarto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quartos.filter((quarto) => {
                  if (!searchTerm) return true;
                  const term = searchTerm.toLowerCase();
                  // Match by room number
                  if (quarto.numero_quarto?.toLowerCase().includes(term)) return true;
                  // Match by guest name or CPF
                  const hospedes = clientesDoQuarto(quarto.id);
                  return hospedes.some(h => 
                    h.nome_completo?.toLowerCase().includes(term) ||
                    h.cpf?.includes(term) ||
                    h.telefone?.includes(term)
                  );
                }).map((quarto) => {
                  const hospedes = clientesDoQuarto(quarto.id);
                  const ocupacaoReal = hospedes.length;
                  const percentOcupacao = quarto.capacidade > 0 ? (ocupacaoReal / quarto.capacidade) * 100 : 0;

                  return (
                    <Card key={quarto.id} className="border-2 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                              <Hotel className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{quarto.numero_quarto}</CardTitle>
                              <p className="text-xs text-gray-500">
                                {getNomeTipoQuarto(quarto.capacidade)}
                              </p>
                              {(quarto.camas_casal > 0 || quarto.camas_solteiro > 0 || quarto.camas_beliche > 0 || quarto.camas_extra > 0) && (
                                <p className="text-[10px] text-blue-600 mt-1">
                                  {quarto.camas_casal > 0 && `${quarto.camas_casal}🛏️`}
                                  {quarto.camas_solteiro > 0 && ` ${quarto.camas_solteiro}🛌`}
                                  {quarto.camas_beliche > 0 && ` ${quarto.camas_beliche}🪜`}
                                  {quarto.camas_extra > 0 && ` ${quarto.camas_extra}➕`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditQuarto(quarto)}
                              className="h-8 w-8 text-blue-600"
                              title="Editar nome e capacidade"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedQuarto(quarto);
                                setShowOcupacaoDialog(true);
                              }}
                              className="h-8 w-8"
                              title="Adicionar hóspede"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteQuarto(quarto)}
                              className="h-8 w-8 text-red-600"
                              title="Excluir quarto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Ocupação</span>
                            <span className="font-semibold">
                              {ocupacaoReal}/{quarto.capacidade}
                            </span>
                          </div>
                          <Progress value={percentOcupacao} className="h-2" />
                        </div>

                        {hospedes.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider"> {/* Removed px-3 py-2 */}
                              Hóspedes:
                            </p>
                            {hospedes.map((hospede, idx) => (
                              <div key={hospede.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                <span className="text-sm text-gray-700 truncate flex-1">
                                  <span className="font-bold text-gray-500 mr-2">{idx + 1}.</span>
                                  {hospede.nome_completo}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoverHospede(hospede, quarto)}
                                  className="h-6 w-6 text-red-600"
                                  title="Remover do quarto"
                                >
                                  <UserMinus className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {hospedes.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-2">
                            Nenhum hóspede
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {quartos.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Bed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum quarto cadastrado ainda</p>
                </div>
              )}
            </CardContent>
          </>
        )}

        {!selectedViagem && (
          <CardContent className="p-12 text-center text-gray-500">
            <Hotel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Selecione uma viagem para gerenciar os quartos</p>
          </CardContent>
        )}
      </Card>

      <Dialog open={showQuartoForm} onOpenChange={setShowQuartoForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQuarto ? 'Editar Quarto' : 'Adicionar Novo Quarto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitQuarto} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Quarto *</Label>
              <Input
                value={formData.numero_quarto}
                onChange={(e) => setFormData({...formData, numero_quarto: e.target.value})}
                placeholder="Ex: 101, Suíte 07, Quarto Feminino A"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo / Capacidade {editingQuarto && clientesDoQuarto(editingQuarto.id).length > 0 && '(Bloqueado - Quarto com hóspedes)'} *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({...formData, tipo: value})}
                disabled={editingQuarto && clientesDoQuarto(editingQuarto.id).length > 0}
              >
                <SelectTrigger className={editingQuarto && clientesDoQuarto(editingQuarto.id).length > 0 ? "bg-gray-100" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simples">Individual (1 vaga)</SelectItem>
                  <SelectItem value="Duplo">Duplo (2 vagas)</SelectItem>
                  <SelectItem value="Triplo">Triplo (3 vagas)</SelectItem>
                  <SelectItem value="Quádruplo">Quádruplo (4 vagas)</SelectItem>
                  <SelectItem value="Quíntuplo">Quíntuplo (5 vagas)</SelectItem>
                  <SelectItem value="Sêxtuplo">Sêxtuplo (6 vagas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">Configuração de Camas 🛏️</Label>
              <p className="text-sm text-gray-600 mb-4">Configure os tipos de camas. A soma deve totalizar {capacidadesPorTipo[formData.tipo]} pessoa(s).</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Camas de Casal (2 pessoas cada)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="3"
                    value={formData.camas_casal}
                    onChange={(e) => setFormData({...formData, camas_casal: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Camas de Solteiro (1 pessoa cada)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="6"
                    value={formData.camas_solteiro}
                    onChange={(e) => setFormData({...formData, camas_solteiro: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Beliches (2 pessoas cada)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="3"
                    value={formData.camas_beliche}
                    onChange={(e) => setFormData({...formData, camas_beliche: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Camas Extra/Colchão (1 pessoa cada)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="3"
                    value={formData.camas_extra}
                    onChange={(e) => setFormData({...formData, camas_extra: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">
                  Total configurado: {(formData.camas_casal * 2) + formData.camas_solteiro + (formData.camas_beliche * 2) + formData.camas_extra} pessoa(s)
                  {((formData.camas_casal * 2) + formData.camas_solteiro + (formData.camas_beliche * 2) + formData.camas_extra) === capacidadesPorTipo[formData.tipo] 
                    ? ' ✅' 
                    : ` ⚠️ (deve ser ${capacidadesPorTipo[formData.tipo]})`}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowQuartoForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingQuarto ? 'Salvar Alterações' : 'Criar Quarto'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showOcupacaoDialog} onOpenChange={setShowOcupacaoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Adicionar Hóspede ao Quarto {selectedQuarto?.numero_quarto}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Ocupação: <span className="font-bold">{selectedQuarto?.ocupados}/{selectedQuarto?.capacidade}</span>
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar cliente por nome, CPF ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {clientesSemQuarto.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {clientesSemQuarto
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
                    onClick={() => handleAdicionarHospede(cliente.id, selectedQuarto)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-sky-50 hover:border-sky-500 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{cliente.nome_completo}</p>
                    <p className="text-sm text-gray-600">{cliente.telefone}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                Todos os clientes já estão alocados em quartos
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}