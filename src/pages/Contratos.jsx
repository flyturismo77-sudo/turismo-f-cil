import React, { useState, useRef } from 'react';
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
  Loader2, User, Plane, Calendar, DollarSign 
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
      const { data, error } = await supabase.from('viagens').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
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

    // Assinaturas
    y = checkPage(y, 50);
    y += 6;
    y = addText(
      'Por estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor, juntamente com 02(duas) testemunhas.',
      margin, y, { fontSize: 10 }
    );
    y += 10;

    const now = new Date();
    y = addText(
      `Januária, Minas Gerais, ${format(now, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`,
      margin, y
    );
    y += 15;

    // Signature lines
    doc.line(margin, y, margin + 75, y);
    y += 4;
    addText('CONTRATADA', margin, y, { fontStyle: 'bold' });
    y += 10;

    doc.line(margin, y, margin + 75, y);
    y += 4;
    addText('CONTRATANTE', margin, y, { fontStyle: 'bold' });

    doc.save(`Contrato_${contrato.nome_completo?.replace(/\s+/g, '_') || 'Viagem'}.pdf`);
    toast({ title: 'PDF gerado com sucesso!' });
  };

  const filteredContratos = contratos.filter(c =>
    c.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Contratos</h2>
          <p className="text-muted-foreground text-sm">Gerencie contratos de viagem</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Contrato
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredContratos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum contrato encontrado</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Criar primeiro contrato
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredContratos.map((contrato) => (
            <Card key={contrato.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{contrato.nome_completo}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{contrato.cpf || 'Sem CPF'}</span>
                        {contrato.viagens && (
                          <>
                            <span>•</span>
                            <span className="truncate">{contrato.viagens.nome || contrato.viagens.destino}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={contrato.status === 'Assinado' ? 'default' : contrato.status === 'Cancelado' ? 'destructive' : 'secondary'}>
                      {contrato.status || 'Pendente'}
                    </Badge>
                    {contrato.valor_total > 0 && (
                      <span className="text-sm font-semibold text-foreground">
                        R$ {Number(contrato.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(contrato)} title="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => gerarPDF(contrato)} title="Gerar PDF">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => {
                        if (confirm('Excluir este contrato?')) deleteMutation.mutate(contrato.id);
                      }}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
                    <Select value={selectedCliente} onValueChange={handleSelectCliente}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome_completo} {c.cpf ? `- ${c.cpf}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <SelectItem value="Assinado">Assinado</SelectItem>
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
