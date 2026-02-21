import React, { useState, useRef } from 'react';
import logoFly from '@/assets/logo-fly-turismo.jpg';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  FileText, Plus, Download, Eye, Search, Trash2, Edit, 
  Loader2, User, Plane, Calendar, DollarSign, MessageCircle, Link2, CheckCircle2, UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';

export default function Contratos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState(null);
  const [selectedViagem, setSelectedViagem] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSearch, setClienteSearch] = useState('');
  const [formData, setFormData] = useState({
    nome_completo: '',
    estado_civil: '',
    data_nascimento: '',
    rg: '',
    cpf: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    telefone: '',
    email: '',
    id_viagem: '',
    passageiros: [],
    valor_total: 0,
    numero_parcelas: 1,
    dia_vencimento: 10,
    forma_pagamento: 'À Vista',
    status: 'Pendente',
  });
  const [passageiros, setPassageiros] = useState([
    { nome_completo: '', cpf: '' },
  ]);

  // Queries
  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens-contratos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('viagens').select('*').eq('arquivada', false).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-contrato', selectedViagem],
    queryFn: async () => {
      let q = supabase.from('clientes').select('*').order('nome_completo');
      if (selectedViagem) q = q.eq('id_viagem', selectedViagem);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!selectedViagem,
  });

  const { data: contratos = [], isLoading } = useQuery({
    queryKey: ['contratos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formularios_contrato')
        .select('*, viagens:id_viagem(nome, destino, data_saida, data_retorno)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: config } = useQuery({
    queryKey: ['config-contrato'],
    queryFn: async () => {
      const { data } = await supabase.from('configuracao_empresa').select('*').limit(1).maybeSingle();
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        passageiros: data.passageiros?.filter(p => p.nome_completo) || [],
      };
      if (editingContrato) {
        const { error } = await supabase.from('formularios_contrato').update(payload).eq('id', editingContrato.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('formularios_contrato').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast({ title: editingContrato ? 'Contrato atualizado!' : 'Contrato criado!' });
      resetForm();
    },
    onError: (err) => {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('formularios_contrato').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast({ title: 'Contrato excluído!' });
    },
  });

  const [processingId, setProcessingId] = useState(null);

  const processarMutation = useMutation({
    mutationFn: async (contrato) => {
      if (contrato.status !== 'Assinado' && contrato.status !== 'Assinado Manualmente') throw new Error('O contrato precisa estar assinado.');
      const viagem = viagens.find(v => v.id === contrato.id_viagem);
      const valorFinal = (contrato.valor_total || viagem?.valor_1 || 0) - (contrato.desconto || 0);

      const { data: cliente, error: clienteErr } = await supabase
        .from('clientes')
        .insert({
          nome_completo: contrato.nome_completo, cpf: contrato.cpf, sexo: contrato.sexo,
          data_nascimento: contrato.data_nascimento, telefone: contrato.telefone, email: contrato.email,
          rua: contrato.rua, numero: contrato.numero, bairro: contrato.bairro, cidade: contrato.cidade,
          id_viagem: contrato.id_viagem,
          forma_pagamento: contrato.numero_parcelas > 1 ? 'Parcelado' : 'À Vista',
          numero_parcelas: contrato.numero_parcelas || 1,
          possui_crianca_colo: contrato.possui_crianca_colo,
          nome_crianca_colo: contrato.nome_crianca_colo,
          idade_crianca_colo: contrato.idade_crianca_colo,
          status_pagamento: 'Pendente', valor_total_pacote: valorFinal, valor_pago: 0,
        }).select().single();
      if (clienteErr) throw clienteErr;

      const passAdicionais = contrato.passageiros?.filter(p => p.nome_completo) || [];
      let totalPessoas = 1;
      for (const p of passAdicionais) {
        const { error: pErr } = await supabase.from('clientes').insert({
          nome_completo: p.nome_completo, cpf: p.cpf || null, telefone: p.telefone || null,
          id_viagem: contrato.id_viagem, id_cliente_principal: cliente.id,
          status_pagamento: 'Vinculado', valor_total_pacote: 0, valor_pago: 0,
        });
        if (!pErr) totalPessoas++;
      }

      const numParcelas = contrato.numero_parcelas || 1;
      if (numParcelas > 0) {
        const valorParcela = valorFinal / numParcelas;
        const diaVenc = contrato.dia_vencimento || 10;
        const hoje = new Date();
        const parcelas = Array.from({ length: numParcelas }, (_, i) => {
          const venc = new Date(hoje.getFullYear(), hoje.getMonth() + i + 1, diaVenc);
          return {
            id_cliente: cliente.id, id_viagem: contrato.id_viagem,
            numero_parcela: i + 1, total_parcelas: numParcelas,
            valor_parcela: Number(valorParcela.toFixed(2)),
            data_vencimento: venc.toISOString().split('T')[0],
            status: 'Pendente', forma_pagamento: contrato.forma_pagamento || 'PIX', intervalo_dias: 30,
          };
        });
        await supabase.from('parcelas').insert(parcelas);
      }

      if (viagem) {
        await supabase.from('viagens').update({ vagas_ocupadas: (viagem.vagas_ocupadas || 0) + totalPessoas }).eq('id', viagem.id);
      }

      await supabase.from('formularios_contrato').update({ status: 'Processado' }).eq('id', contrato.id);
      return totalPessoas;
    },
    onSuccess: (totalPessoas) => {
      setProcessingId(null);
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['viagens'] });
      toast({ title: `✅ Processado! ${totalPessoas} pessoa(s) inserida(s) na viagem.` });
    },
    onError: (err) => {
      setProcessingId(null);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });

  const handleProcessar = (contrato) => {
    if (contrato.status === 'Processado') { toast({ title: 'Já processado!' }); return; }
    if (contrato.status !== 'Assinado' && contrato.status !== 'Assinado Manualmente') { toast({ title: 'Cliente precisa assinar primeiro.', variant: 'destructive' }); return; }
    setProcessingId(contrato.id);
    processarMutation.mutate(contrato);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingContrato(null);
    setSelectedViagem('');
    setSelectedCliente('');
    setFormData({
      nome_completo: '', estado_civil: '', data_nascimento: '', rg: '', cpf: '',
      rua: '', numero: '', bairro: '', cidade: '', telefone: '', email: '',
      id_viagem: '', passageiros: [], valor_total: 0, numero_parcelas: 1,
      dia_vencimento: 10, forma_pagamento: 'À Vista', status: 'Pendente',
    });
    setPassageiros([{ nome_completo: '', cpf: '' }]);
  };

  const handleSelectCliente = (clienteId) => {
    setSelectedCliente(clienteId);
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    setFormData(prev => ({
      ...prev,
      nome_completo: cliente.nome_completo || '',
      cpf: cliente.cpf || '',
      data_nascimento: cliente.data_nascimento || '',
      rua: cliente.rua || '',
      numero: cliente.numero || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      id_viagem: selectedViagem,
      valor_total: cliente.valor_total_pacote || 0,
      numero_parcelas: cliente.numero_parcelas || 1,
      forma_pagamento: cliente.forma_pagamento || 'À Vista',
    }));
  };

  const handleSelectViagem = (viagemId) => {
    setSelectedViagem(viagemId);
    setSelectedCliente('');
    setFormData(prev => ({ ...prev, id_viagem: viagemId }));
  };

  const handleEdit = (contrato) => {
    setEditingContrato(contrato);
    setFormData({
      nome_completo: contrato.nome_completo || '',
      estado_civil: contrato.estado_civil || '',
      data_nascimento: contrato.data_nascimento || '',
      rg: contrato.rg || '',
      cpf: contrato.cpf || '',
      rua: contrato.rua || '',
      numero: contrato.numero || '',
      bairro: contrato.bairro || '',
      cidade: contrato.cidade || '',
      telefone: contrato.telefone || '',
      email: contrato.email || '',
      id_viagem: contrato.id_viagem || '',
      passageiros: contrato.passageiros || [],
      valor_total: contrato.valor_total || 0,
      numero_parcelas: contrato.numero_parcelas || 1,
      dia_vencimento: contrato.dia_vencimento || 10,
      forma_pagamento: contrato.forma_pagamento || 'À Vista',
      status: contrato.status || 'Pendente',
    });
    setPassageiros(
      contrato.passageiros?.length > 0 
        ? contrato.passageiros 
        : [{ nome_completo: '', cpf: '' }]
    );
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome_completo) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    saveMutation.mutate({ ...formData, passageiros });
  };

  // PDF Generation - matching the original contract layout
  const gerarPDF = (contrato) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const empresa = config || {};
    const viagem = viagens.find(v => v.id === contrato.id_viagem) || contrato.viagens || {};

    // Helper functions
    const addText = (text, x, currentY, options = {}) => {
      const { fontSize = 10, fontStyle = 'normal', align = 'left', maxWidth = contentWidth } = options;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, currentY, { align });
      return currentY + (lines.length * fontSize * 0.4);
    };

    const addLine = (currentY) => {
      doc.setDrawColor(0);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      return currentY + 2;
    };

    const checkPage = (currentY, needed = 30) => {
      if (currentY + needed > 280) {
        doc.addPage();
        return 20;
      }
      return currentY;
    };

    // Logo no topo
    try {
      doc.addImage(logoFly, 'JPEG', pageWidth / 2 - 22, y, 44, 44);
      y += 50;
    } catch (e) {
      y += 5;
    }

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE VIAGEM', pageWidth / 2, y, { align: 'center' });
    y += 12;

    // Contratada
    y = addText(
      `CONTRATADA: ${empresa.nome_empresa || 'FLY TURISMO'}, com sede na ${empresa.endereco || 'Rua Padre Idelino, 66, centro - Januária – MG – CEP:39.480-000'}, Fone:${empresa.telefone || '(38)9755-2155'}, CNPJ 14.121.276 / 0001-32.`,
      margin, y, { fontSize: 10, fontStyle: 'bold' }
    );
    y += 4;

    // Contratante
    y = addText(`CONTRATANTE: ${contrato.nome_completo || '___________________'}, Est. Civil: ${contrato.estado_civil || '___________'} Data de Nascimento: ${contrato.data_nascimento ? format(new Date(contrato.data_nascimento + 'T12:00:00'), 'dd/MM/yyyy') : '___/___/______'}`, margin, y);
    y += 2;
    y = addText(`RG: ${contrato.rg || '___________________'}    CPF: ${contrato.cpf || '___________________'}`, margin, y);
    y += 2;
    y = addText(`Endereço: ${contrato.rua || '___________________'}, ${contrato.numero || '___'}    Bairro: ${contrato.bairro || '___________________'}`, margin, y);
    y += 2;
    y = addText(`Cidade: ${contrato.cidade || '___________________'}    Fone: ${contrato.telefone || '___________________'}`, margin, y);
    y += 2;
    y = addText(`Email: ${contrato.email || '___________________'}.`, margin, y);
    y += 6;

    // Pacote
    const dataSaida = viagem.data_saida ? format(new Date(viagem.data_saida + 'T12:00:00'), 'dd/MM/yyyy') : '___/___/______';
    const dataRetorno = viagem.data_retorno ? format(new Date(viagem.data_retorno + 'T12:00:00'), 'dd/MM/yyyy') : '___/___/______';
    y = addText(
      `PACOTE ADQUIRIDO: Pacote para ${viagem.destino || viagem.nome || '___________________'}, Data inicial: ${dataSaida}, Data final: ${dataRetorno}, conforme condições descritas no ROTEIRO ANEXO que passa a integrar o presente contrato.`,
      margin, y, { fontStyle: 'bold' }
    );
    y += 4;

    // Passageiros
    const pass = contrato.passageiros || [];
    for (let i = 0; i < 3; i++) {
      const p = pass[i] || {};
      y = addText(`Passageiro ${String(i + 1).padStart(2, '0')}: ${p.nome_completo || '___________________________________'}`, margin, y);
      y += 1;
      y = addText(`CPF: ${p.cpf || '___________________________________'}`, margin, y);
      y += 2;
    }
    y += 2;

    // Valor
    const valorStr = contrato.valor_total 
      ? `R$ ${Number(contrato.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : 'R$ ___________';
    y = addText(
      `O pacote de viagem contratado será no valor de ${valorStr}, com pagamento em ${contrato.numero_parcelas || '___'} parcelas, com vencimento mensal no dia ${contrato.dia_vencimento || '___'}, devendo a quitação total ocorrer até 05 (cinco) dias antes saída da viagem contratada.`,
      margin, y
    );
    y += 6;

    // Cláusulas
    const clausulas = [
      'As partes acima qualificadas resolvem firmar o presente contrato, elaborado de acordo com a Lei nº 8.078/1990, deliberação normativa da Embratur nº 161/85 e as normas da Associação Brasileira das Agências de Viagem, cujas cláusulas e condições encontram a seguir dispostas.',
      'Os serviços adquiridos pela parte Contratante incluem transporte terrestre e acomodação conforme especificado no programa de viagem e confirmação de reserva, conforme roteiro descrito nas redes sociais da Agência Contratada, documentos estes integrantes do presente contrato.',
      'Os direitos e obrigações que as partes estão mutuamente assumindo neste contrato começam a viger a partir da sua assinatura e se efetivam no momento da confirmação da reserva, quando do pagamento do preço do pacote turístico ou do produto discriminado ou ao menos o valor da entrada do pacote.',
      'Os pagamentos serão realizados em pix, cartão de crédito ou dinheiro na agência mediante recibo, ou boleto conforme acordado no momento da contratação. O preço do pacote poderá ser parcelado conforme ofertado pela contratada, mas com quitação sempre antes do início do passeio. O preço de pacotes para crianças deverá ser consultado junto a Contratada.',
    ];

    for (const cl of clausulas) {
      y = checkPage(y, 20);
      y = addText(cl, margin, y, { fontSize: 9 });
      y += 3;
    }

    // Cláusulas numeradas
    const clausulasNum = [
      { num: 'I', text: 'O atraso no pagamento de qualquer das parcelas acarretará ao Contratante multa moratória desde logo fixada em 1% sobre o valor da prestação, além de juros calculados ao mês de 0,33% sobre o valor da prestação acrescido de correção monetária conforme índices legais, despesas de cobrança extrajudicial e judicial, honorários advocatícios e custas judiciais, quando necessária a propositura da ação.\n\nO atraso no pagamento da parcela por mais de 10 (dez) dias, facultará a Contratada a proceder ao protesto por falta de pagamento, junto ao competente cartório, valendo este contrato, acompanhado da respectiva nota fiscal de serviços, como título executivo extrajudicial.' },
      { num: 'II', text: 'Solicitações de CANCELAMENTO ou transferências da viagem por conta do CONTRATANTE deverão ser solicitadas por escrito ou via e-mail: flyturismo77@gmail.com no prazo de até 30 (trinta) dias antes do início da partida da excursão.' },
      { num: 'III', text: 'O Contratante pode optar por remarcar a viagem até 72 (setenta e duas) horas antes, entretanto pagará uma taxa de custo operacional no percentual de 20% do valor contratado por pessoa. No caso de cancelamento da viagem por parte da FLY TURISMO, por não ter atingido o número mínimo de 30 (trinta) passageiros, a mesma se reserva no direito de oferecer outra data para a viagem. A reserva feita pelo passageiro só será garantida mediante assinatura do CONTRATO e pagamento da entrada do pacote. O roteiro poderá sofrer alterações desde com aviso prévio, mediante as condições meteorológicas ou operacionais.' },
      { num: 'IV', text: 'Os termos da excursão contratada poderão ser cancelados ou adiados algum tipo de passeio, caso as condições climáticas adversas não permitam, ex: chuvas, ventos, tempestades e etc.' },
      { num: 'V', text: 'A viagem será com ônibus que contará com ar condicionado, frigobar, água mineral, e toalete. Apartamentos com ar condicionado, TV, Frigobar e banheiro. Guia especializado acompanhando o grupo e agenciando passeios locais.' },
      { num: 'VI', text: 'A inadimplência no caso de contrato parcelado, vencida a 3ª parcela sem pagamento, restará rescindido, com multa rescisória de perdimento do valor pago no percentual de 30% com recebimento agendado, 90 (noventa) dias após a realização da viagem contratada.' },
      { num: 'VII', text: 'O cancelamento do contrato poderá ocorrer com prazo superior ou igual a 30 (trinta) dias antes da data estipulada para o início da viagem, com multa contratual de perda de 10%, entre 30 (trinta) e 21 (vinte e um) dias, multa de 20%, e prazo inferior a 21 (vinte e um) dias multa de 30% e a restituição dos valores ocorrerá após 90 (noventa) dias do término do contrato da viagem com agendamento prévio com a Contratada.\n\nAlém das multas previstas são deduzidas as despesas de taxas de juros de cartão de crédito, financiamentos e multas eventualmente cobradas pelos fornecedores (transportes, receptivos, hotéis, restaurantes e outros serviços), devidamente comprovados e que não forem passíveis de recuperação.\n\nEm caso de óbito (ascendentes e descendentes) ou problemas de saúde do Contratante, será efetuada a devolução da integralidade do valor pago se comprovado através de atestado médico com CRM, no prazo máximo de 30 (trinta) dias após a viagem contratada.\n\nCaso haja desistência por parte do Contratante a menos de 48 horas antes da viagem, não haverá devolução de valores nem concessão de bônus para o desistente.\n\nOs atrasos e os cancelamentos de trajetos motivados por razões técnicas, operacionais, mecânicas ou meteorológicas, sobre os quais a Contratada e seus prestadores de serviços terceirizados não possuem poder de previsão ou controle, estão incluídos nos casos fortuitos ou de força maior, que a isentam de responsabilidade civil e criminal.' },
      { num: 'VIII', text: 'Outros serviços não descritos no contrato não serão responsabilidade do Contratado. Os passeios opcionais não estão inclusos no preço contratado, não tendo a Contratada qualquer responsabilidade quando a contratação e execução.\n\nFica estabelecido entre as partes que o foro escolhido é o da comarca de Januária, para resolver as controvérsias que eventualmente surjam deste contrato.' },
    ];

    for (const cl of clausulasNum) {
      y = checkPage(y, 25);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(cl.num, pageWidth / 2, y, { align: 'center' });
      y += 5;
      y = addText(cl.text, margin, y, { fontSize: 9 });
      y += 4;
    }

    // ═══ PÁGINA DE ASSINATURAS ═══
    // Sempre em nova página, seguindo o layout do documento oficial
    doc.addPage();
    y = 20;
    const centerX = pageWidth / 2;

    // Logo no topo da página de assinatura
    try {
      doc.addImage(logoFly, 'JPEG', centerX - 18, y, 36, 36);
      y += 42;
    } catch (e) {
      y += 5;
    }

    // Texto de encerramento
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const textoEncerramento = 'Por estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor, juntamente com 02(duas) testemunhas.';
    const linhasEnc = doc.splitTextToSize(textoEncerramento, contentWidth);
    doc.text(linhasEnc, margin, y);
    y += linhasEnc.length * 5 + 10;

    // Data — sempre com campos em branco como no documento original
    y = addText(
      'Januária, Minas Gerais, ______________, de ______________, 202___.', 
      margin, y
    );
    y += 15;

    // Se assinado eletronicamente — selo gov.br + assinaturas preenchidas
    if (contrato.assinatura_data && contrato.assinatura_nome) {
      // ── Selo de assinatura digital gov.br ──
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Documento assinado digitalmente', centerX, y, { align: 'center' });
      y += 4;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 80, 160);
      doc.text('gov.br', centerX, y, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      y += 4;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text((contrato.assinatura_nome || '').toUpperCase(), centerX, y, { align: 'center' });
      y += 3;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      const dataAssinatura = format(new Date(contrato.assinatura_data), "dd/MM/yyyy HH:mm:ss xx", { locale: ptBR });
      doc.text(`Data: ${dataAssinatura}`, centerX, y, { align: 'center' });
      y += 3;
      doc.text('Verifique em https://validar.iti.gov.br', centerX, y, { align: 'center' });
      y += 8;

      // Linha CONTRATADA
      const lineW = 80;
      doc.line(centerX - lineW / 2, y, centerX + lineW / 2, y);
      y += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATADA', centerX, y, { align: 'center' });
      y += 20;

      // Linha CONTRATANTE
      doc.line(centerX - lineW / 2, y, centerX + lineW / 2, y);
      y += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATANTE', centerX, y, { align: 'center' });

    } else {
      // Contrato não assinado — linhas em branco centralizadas
      const lineW = 80;
      doc.line(centerX - lineW / 2, y, centerX + lineW / 2, y);
      y += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATADA', centerX, y, { align: 'center' });
      y += 20;

      doc.line(centerX - lineW / 2, y, centerX + lineW / 2, y);
      y += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATANTE', centerX, y, { align: 'center' });
    }

    doc.save(`Contrato_${contrato.nome_completo?.replace(/\s+/g, '_') || 'Viagem'}.pdf`);
    toast({ title: 'PDF gerado com sucesso!' });
  };

  const copiarLinkAssinatura = (contrato) => {
    if (!contrato.link_assinatura) {
      toast({ title: 'Este contrato não possui link de assinatura.', variant: 'destructive' });
      return;
    }
    const url = `${window.location.origin}/AssinaturaContrato?id=${contrato.link_assinatura}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: '✅ Link de assinatura copiado!', description: 'Cole no WhatsApp ou e-mail para o cliente assinar.' });
    }).catch(() => {
      // fallback para dispositivos sem clipboard API
      window.prompt('Copie o link abaixo:', url);
    });
  };

  const enviarWhatsApp = (contrato) => {
    const viagem = viagens.find(v => v.id === contrato.id_viagem) || contrato.viagens || {};
    const empresa = config || {};
    const dataSaida = viagem.data_saida ? format(new Date(viagem.data_saida + 'T12:00:00'), 'dd/MM/yyyy') : 'A definir';
    const dataRetorno = viagem.data_retorno ? format(new Date(viagem.data_retorno + 'T12:00:00'), 'dd/MM/yyyy') : 'A definir';
    const valorStr = contrato.valor_total 
      ? `R$ ${Number(contrato.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : 'A combinar';

    const mensagem = `📄 *CONTRATO DE VIAGEM*\n\n` +
      `🏢 *${empresa.nome_empresa || 'FLY TURISMO'}*\n\n` +
      `👤 *Contratante:* ${contrato.nome_completo}\n` +
      `📝 CPF: ${contrato.cpf || 'Não informado'}\n` +
      `📞 Tel: ${contrato.telefone || 'Não informado'}\n\n` +
      `✈️ *Viagem:* ${viagem.destino || viagem.nome || 'Não definida'}\n` +
      `📅 Saída: ${dataSaida}\n` +
      `📅 Retorno: ${dataRetorno}\n\n` +
      `💰 *Valor:* ${valorStr}\n` +
      `💳 Pagamento: ${contrato.forma_pagamento || 'À Vista'}\n` +
      `📊 Parcelas: ${contrato.numero_parcelas || 1}x\n\n` +
      `📌 Status: ${contrato.status || 'Pendente'}\n\n` +
      `_Contrato gerado pelo sistema ${empresa.nome_empresa || 'Fly Turismo'}_`;

    const telefone = contrato.telefone?.replace(/\D/g, '') || '';
    const url = `https://wa.me/${telefone.startsWith('55') ? telefone : '55' + telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  // Gerar PDF do contrato em branco (sem dados de cliente) com página de assinatura
  const gerarPDFEmBranco = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const marg = 20;
    const cWidth = pageWidth - marg * 2;
    let yy = 20;
    const emp = config || {};

    const addTxt = (text, x, curY, options = {}) => {
      const { fontSize = 10, fontStyle = 'normal', align = 'left', maxWidth = cWidth } = options;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, curY, { align });
      return curY + (lines.length * fontSize * 0.4);
    };

    const chkPage = (curY, needed = 30) => {
      if (curY + needed > 280) { doc.addPage(); return 20; }
      return curY;
    };

    // Logo
    try { doc.addImage(logoFly, 'JPEG', pageWidth / 2 - 22, yy, 44, 44); yy += 50; } catch (e) { yy += 5; }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE VIAGEM', pageWidth / 2, yy, { align: 'center' });
    yy += 12;

    yy = addTxt(
      `CONTRATADA: ${emp.nome_empresa || 'FLY TURISMO'}, com sede na ${emp.endereco || 'Rua Padre Idelino, 66, centro - Januária – MG – CEP:39.480-000'}, Fone:${emp.telefone || '(38)9755-2155'}, CNPJ 14.121.276 / 0001-32.`,
      marg, yy, { fontSize: 10, fontStyle: 'bold' }
    );
    yy += 4;

    yy = addTxt('CONTRATANTE: ___________________________________, Est. Civil: ___________ Data de Nascimento: ___/___/______', marg, yy);
    yy += 2;
    yy = addTxt('RG: ___________________    CPF: ___________________', marg, yy);
    yy += 2;
    yy = addTxt('Endereço: ___________________________________, ___    Bairro: ___________________', marg, yy);
    yy += 2;
    yy = addTxt('Cidade: ___________________    Fone: ___________________', marg, yy);
    yy += 2;
    yy = addTxt('Email: ___________________________________.', marg, yy);
    yy += 6;

    yy = addTxt(
      'PACOTE ADQUIRIDO: Pacote para ___________________________________, Data inicial: ___/___/______, Data final: ___/___/______, conforme condições descritas no ROTEIRO ANEXO que passa a integrar o presente contrato.',
      marg, yy, { fontStyle: 'bold' }
    );
    yy += 4;

    for (let i = 0; i < 3; i++) {
      yy = addTxt(`Passageiro ${String(i + 1).padStart(2, '0')}: ___________________________________`, marg, yy);
      yy += 1;
      yy = addTxt('CPF: ___________________________________', marg, yy);
      yy += 2;
    }
    yy += 2;

    yy = addTxt(
      'O pacote de viagem contratado será no valor de R$ ___________, com pagamento em ___ parcelas, com vencimento mensal no dia ___, devendo a quitação total ocorrer até 05 (cinco) dias antes saída da viagem contratada.',
      marg, yy
    );
    yy += 6;

    const cls = [
      'As partes acima qualificadas resolvem firmar o presente contrato, elaborado de acordo com a Lei nº 8.078/1990, deliberação normativa da Embratur nº 161/85 e as normas da Associação Brasileira das Agências de Viagem, cujas cláusulas e condições encontram a seguir dispostas.',
      'Os serviços adquiridos pela parte Contratante incluem transporte terrestre e acomodação conforme especificado no programa de viagem e confirmação de reserva, conforme roteiro descrito nas redes sociais da Agência Contratada, documentos estes integrantes do presente contrato.',
      'Os direitos e obrigações que as partes estão mutuamente assumindo neste contrato começam a viger a partir da sua assinatura e se efetivam no momento da confirmação da reserva, quando do pagamento do preço do pacote turístico ou do produto discriminado ou ao menos o valor da entrada do pacote.',
      'Os pagamentos serão realizados em pix, cartão de crédito ou dinheiro na agência mediante recibo, ou boleto conforme acordado no momento da contratação. O preço do pacote poderá ser parcelado conforme ofertado pela contratada, mas com quitação sempre antes do início do passeio. O preço de pacotes para crianças deverá ser consultado junto a Contratada.',
    ];
    for (const c of cls) { yy = chkPage(yy, 20); yy = addTxt(c, marg, yy, { fontSize: 9 }); yy += 3; }

    const clsNum = [
      { num: 'I', text: 'O atraso no pagamento de qualquer das parcelas acarretará ao Contratante multa moratória desde logo fixada em 1% sobre o valor da prestação, além de juros calculados ao mês de 0,33% sobre o valor da prestação acrescido de correção monetária conforme índices legais, despesas de cobrança extrajudicial e judicial, honorários advocatícios e custas judiciais, quando necessária a propositura da ação.\n\nO atraso no pagamento da parcela por mais de 10 (dez) dias, facultará a Contratada a proceder ao protesto por falta de pagamento, junto ao competente cartório, valendo este contrato, acompanhado da respectiva nota fiscal de serviços, como título executivo extrajudicial.' },
      { num: 'II', text: 'Solicitações de CANCELAMENTO ou transferências da viagem por conta do CONTRATANTE deverão ser solicitadas por escrito ou via e-mail: flyturismo77@gmail.com no prazo de até 30 (trinta) dias antes do início da partida da excursão.' },
      { num: 'III', text: 'O Contratante pode optar por remarcar a viagem até 72 (setenta e duas) horas antes, entretanto pagará uma taxa de custo operacional no percentual de 20% do valor contratado por pessoa. No caso de cancelamento da viagem por parte da FLY TURISMO, por não ter atingido o número mínimo de 30 (trinta) passageiros, a mesma se reserva no direito de oferecer outra data para a viagem. A reserva feita pelo passageiro só será garantida mediante assinatura do CONTRATO e pagamento da entrada do pacote. O roteiro poderá sofrer alterações desde com aviso prévio, mediante as condições meteorológicas ou operacionais.' },
      { num: 'IV', text: 'Os termos da excursão contratada poderão ser cancelados ou adiados algum tipo de passeio, caso as condições climáticas adversas não permitam, ex: chuvas, ventos, tempestades e etc.' },
      { num: 'V', text: 'A viagem será com ônibus que contará com ar condicionado, frigobar, água mineral, e toalete. Apartamentos com ar condicionado, TV, Frigobar e banheiro. Guia especializado acompanhando o grupo e agenciando passeios locais.' },
      { num: 'VI', text: 'A inadimplência no caso de contrato parcelado, vencida a 3ª parcela sem pagamento, restará rescindido, com multa rescisória de perdimento do valor pago no percentual de 30% com recebimento agendado, 90 (noventa) dias após a realização da viagem contratada.' },
      { num: 'VII', text: 'O cancelamento do contrato poderá ocorrer com prazo superior ou igual a 30 (trinta) dias antes da data estipulada para o início da viagem, com multa contratual de perda de 10%, entre 30 (trinta) e 21 (vinte e um) dias, multa de 20%, e prazo inferior a 21 (vinte e um) dias multa de 30% e a restituição dos valores ocorrerá após 90 (noventa) dias do término do contrato da viagem com agendamento prévio com a Contratada.\n\nAlém das multas previstas são deduzidas as despesas de taxas de juros de cartão de crédito, financiamentos e multas eventualmente cobradas pelos fornecedores (transportes, receptivos, hotéis, restaurantes e outros serviços), devidamente comprovados e que não forem passíveis de recuperação.\n\nEm caso de óbito (ascendentes e descendentes) ou problemas de saúde do Contratante, será efetuada a devolução da integralidade do valor pago se comprovado através de atestado médico com CRM, no prazo máximo de 30 (trinta) dias após a viagem contratada.\n\nCaso haja desistência por parte do Contratante a menos de 48 horas antes da viagem, não haverá devolução de valores nem concessão de bônus para o desistente.\n\nOs atrasos e os cancelamentos de trajetos motivados por razões técnicas, operacionais, mecânicas ou meteorológicas, sobre os quais a Contratada e seus prestadores de serviços terceirizados não possuem poder de previsão ou controle, estão incluídos nos casos fortuitos ou de força maior, que a isentam de responsabilidade civil e criminal.' },
      { num: 'VIII', text: 'Outros serviços não descritos no contrato não serão responsabilidade do Contratado. Os passeios opcionais não estão inclusos no preço contratado, não tendo a Contratada qualquer responsabilidade quando a contratação e execução.\n\nFica estabelecido entre as partes que o foro escolhido é o da comarca de Januária, para resolver as controvérsias que eventualmente surjam deste contrato.' },
    ];
    for (const c of clsNum) {
      yy = chkPage(yy, 25);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text(c.num, pageWidth / 2, yy, { align: 'center' }); yy += 5;
      yy = addTxt(c.text, marg, yy, { fontSize: 9 }); yy += 4;
    }

    // ═══ PÁGINA DE ASSINATURA ═══
    doc.addPage();
    yy = 20;
    const cx = pageWidth / 2;
    try { doc.addImage(logoFly, 'JPEG', cx - 18, yy, 36, 36); yy += 42; } catch (e) { yy += 5; }

    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    const txtEnc = 'Por estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor, juntamente com 02(duas) testemunhas.';
    const lnsEnc = doc.splitTextToSize(txtEnc, cWidth);
    doc.text(lnsEnc, marg, yy); yy += lnsEnc.length * 5 + 10;

    yy = addTxt('Januária, Minas Gerais, ______________, de ______________, 202___.', marg, yy);
    yy += 15;

    // Selo gov.br
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Documento assinado digitalmente', cx, yy, { align: 'center' }); yy += 4;
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 160);
    doc.text('gov.br', cx, yy, { align: 'center' });
    doc.setTextColor(0, 0, 0); yy += 4;
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('MARCELLY BEATRIZ LOPES LUNA', cx, yy, { align: 'center' }); yy += 3;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
    doc.text('Verifique em https://validar.iti.gov.br', cx, yy, { align: 'center' }); yy += 8;

    const lW = 80;
    doc.line(cx - lW / 2, yy, cx + lW / 2, yy); yy += 5;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('CONTRATADA', cx, yy, { align: 'center' }); yy += 20;
    doc.line(cx - lW / 2, yy, cx + lW / 2, yy); yy += 5;
    doc.text('CONTRATANTE', cx, yy, { align: 'center' });

    doc.save('Contrato_em_Branco_Fly_Turismo.pdf');
    toast({ title: '📄 PDF do contrato em branco gerado com sucesso!' });
  };

  const filteredContratos = contratos.filter(c =>
    c.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-400/80 to-blue-400/70 p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white">Contratos</h2>
            <p className="text-white/80 text-sm mt-1">Gerencie e gere contratos de viagem</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={gerarPDFEmBranco} variant="outline" className="gap-2 bg-white/80 text-sky-700 hover:bg-white shadow-lg font-semibold">
              <Download className="w-4 h-4" /> Contrato em Branco
            </Button>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2 bg-white text-sky-600 hover:bg-white/90 shadow-lg font-semibold">
              <Plus className="w-4 h-4" /> Novo Contrato
            </Button>
          </div>
        </div>
        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{contratos.length}</p>
            <p className="text-xs text-white/70">Total</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{contratos.filter(c => c.status === 'Assinado').length}</p>
            <p className="text-xs text-white/70">Assinados</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{contratos.filter(c => c.status === 'Pendente' || !c.status).length}</p>
            <p className="text-xs text-white/70">Pendentes</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-muted bg-secondary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </div>
      ) : filteredContratos.length === 0 ? (
        <Card className="border-dashed border-2 border-sky-200 bg-sky-50/50">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-sky-400" />
            </div>
            <p className="text-muted-foreground font-medium">Nenhum contrato encontrado</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Crie seu primeiro contrato para começar</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="mt-5 gap-2 bg-sky-400 hover:bg-sky-500 text-white">
              <Plus className="w-4 h-4" /> Criar primeiro contrato
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredContratos.map((contrato, index) => (
            <Card key={contrato.id} className="group hover:shadow-lg hover:border-sky-200 transition-all duration-300 border">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center shrink-0 group-hover:from-sky-200 group-hover:to-blue-200 transition-colors">
                      <FileText className="w-5 h-5 text-sky-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate text-base">{contrato.nome_completo}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <span>{contrato.cpf || 'Sem CPF'}</span>
                        {contrato.viagens && (
                          <>
                            <span className="text-sky-300">•</span>
                            <span className="truncate text-sky-600/70">{contrato.viagens.nome || contrato.viagens.destino}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className={
                      contrato.status === 'Assinado' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                      contrato.status === 'Assinado Manualmente' ? 'bg-teal-100 text-teal-700 hover:bg-teal-100' :
                      contrato.status === 'Processado' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                      contrato.status === 'Contrato Enviado' ? 'bg-violet-100 text-violet-700 hover:bg-violet-100' :
                      contrato.status === 'Cancelado' ? 'bg-red-100 text-red-700 hover:bg-red-100' : 
                      'bg-amber-100 text-amber-700 hover:bg-amber-100'
                    }>
                      {contrato.status || 'Pendente'}
                    </Badge>
                    {contrato.valor_total > 0 && (
                      <span className="text-sm font-bold text-foreground bg-secondary px-3 py-1 rounded-lg">
                        R$ {Number(contrato.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(contrato)} title="Editar" className="hover:bg-sky-50 hover:text-sky-600">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => gerarPDF(contrato)} title="Gerar PDF" className="hover:bg-sky-50 hover:text-sky-600">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => copiarLinkAssinatura(contrato)}
                        title={contrato.assinatura_data ? "Contrato já assinado" : "Copiar link de assinatura"}
                        className={contrato.assinatura_data ? "hover:bg-green-50 text-green-500" : "hover:bg-violet-50 hover:text-violet-600"}
                      >
                        {contrato.assinatura_data ? <CheckCircle2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => enviarWhatsApp(contrato)} title="Enviar via WhatsApp" className="hover:bg-emerald-50 hover:text-emerald-600">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => {
                          if (confirm('Excluir este contrato?')) deleteMutation.mutate(contrato.id);
                        }}
                        title="Excluir"
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    {/* Processar button for signed contracts */}
                    {(contrato.status === 'Assinado' || contrato.status === 'Assinado Manualmente') && (
                      <Button
                        size="sm"
                        onClick={() => handleProcessar(contrato)}
                        disabled={processingId === contrato.id}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white ml-2"
                      >
                        {processingId === contrato.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Processar — Inserir na Viagem
                      </Button>
                    )}
                    {contrato.status === 'Processado' && (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1 ml-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Inserido na viagem
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog - Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContrato ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1 - Select Viagem */}
            {!editingContrato && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Plane className="w-4 h-4" /> 1. Selecione a Viagem
                </h3>
                <Select value={selectedViagem} onValueChange={handleSelectViagem}>
                  <SelectTrigger>
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

                {/* Step 2 - Select Cliente */}
                {selectedViagem && (
                  <>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" /> 2. Selecione o Cliente (preenche automaticamente)
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, CPF ou telefone..."
                        value={clienteSearch}
                        onChange={(e) => setClienteSearch(e.target.value)}
                        className="pl-10 mb-2"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                      {clientes
                        .filter(c => {
                          if (!clienteSearch) return true;
                          const term = clienteSearch.toLowerCase();
                          return (
                            c.nome_completo?.toLowerCase().includes(term) ||
                            c.cpf?.includes(term) ||
                            c.telefone?.includes(term)
                          );
                        })
                        .map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCliente(c.id)}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent ${
                              selectedCliente === c.id ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground'
                            }`}
                          >
                            {c.nome_completo} {c.cpf ? `- ${c.cpf}` : ''} {c.telefone ? `- ${c.telefone}` : ''}
                          </button>
                        ))
                      }
                      {clientes.filter(c => {
                        if (!clienteSearch) return true;
                        const term = clienteSearch.toLowerCase();
                        return c.nome_completo?.toLowerCase().includes(term) || c.cpf?.includes(term) || c.telefone?.includes(term);
                      }).length === 0 && (
                        <p className="px-3 py-4 text-sm text-muted-foreground text-center">Nenhum cliente encontrado</p>
                      )}
                    </div>
                  </>
                )}
                <Separator />
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Dados do Contratante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <Label>Nome Completo *</Label>
                  <Input value={formData.nome_completo} onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Estado Civil</Label>
                  <Select value={formData.estado_civil} onValueChange={(v) => setFormData({ ...formData, estado_civil: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                      <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                      <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                      <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                      <SelectItem value="União Estável">União Estável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>RG</Label>
                  <Input value={formData.rg} onChange={(e) => setFormData({ ...formData, rg: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>CPF</Label>
                  <Input value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>

              <h4 className="font-semibold text-foreground text-sm">Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <Label>Rua</Label>
                  <Input value={formData.rua} onChange={(e) => setFormData({ ...formData, rua: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Número</Label>
                  <Input value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Bairro</Label>
                  <Input value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label>Cidade</Label>
                  <Input value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Passageiros */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Passageiros</h3>
                {passageiros.length < 3 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setPassageiros([...passageiros, { nome_completo: '', cpf: '' }])}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                )}
              </div>
              {passageiros.map((p, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div className="space-y-1">
                    <Label>Passageiro {i + 1} - Nome</Label>
                    <Input value={p.nome_completo} onChange={(e) => {
                      const np = [...passageiros];
                      np[i].nome_completo = e.target.value;
                      setPassageiros(np);
                    }} />
                  </div>
                  <div className="space-y-1">
                    <Label>CPF</Label>
                    <Input value={p.cpf} onChange={(e) => {
                      const np = [...passageiros];
                      np[i].cpf = e.target.value;
                      setPassageiros(np);
                    }} />
                  </div>
                  {passageiros.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => setPassageiros(passageiros.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* Pagamento */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Pagamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Valor Total (R$)</Label>
                  <Input type="number" step="0.01" value={formData.valor_total} onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label>Forma de Pagamento</Label>
                  <Select value={formData.forma_pagamento} onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="À Vista">À Vista</SelectItem>
                      <SelectItem value="Parcelado">Parcelado</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Nº de Parcelas</Label>
                  <Input type="number" min="1" max="12" value={formData.numero_parcelas} onChange={(e) => setFormData({ ...formData, numero_parcelas: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="space-y-1">
                  <Label>Dia de Vencimento</Label>
                  <Input type="number" min="1" max="31" value={formData.dia_vencimento} onChange={(e) => setFormData({ ...formData, dia_vencimento: parseInt(e.target.value) || 10 })} />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Contrato Enviado">Contrato Enviado</SelectItem>
                      <SelectItem value="Assinado">Assinado (Digital)</SelectItem>
                      <SelectItem value="Assinado Manualmente">Assinado Manualmente</SelectItem>
                      <SelectItem value="Processado">Processado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingContrato ? 'Salvar Alterações' : 'Criar Contrato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
