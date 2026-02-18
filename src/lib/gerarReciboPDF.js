import jsPDF from 'jspdf';
import logoFly from '@/assets/logo-fly-turismo.jpg';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Gera um recibo de pagamento em PDF e dispara o download.
 * @param {object} parcela - objeto da parcela paga
 * @param {object} cliente - objeto do cliente
 * @param {object} viagem  - objeto da viagem (pode ser null)
 * @param {object} config  - configurações da empresa
 */
export function gerarReciboPDF({ parcela, cliente, viagem, config }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  let y = 20;

  const empresa = config || {};
  const nomeEmpresa = empresa.nome_empresa || 'FLY TURISMO';
  const cnpj = '14.121.276/0001-32';
  const endereco = empresa.endereco || 'Rua Padre Idelino, 66, Centro – Januária/MG';
  const telefone = empresa.telefone || '(38) 9755-2155';

  // Número de recibo único baseado em timestamp + primeiros chars do id da parcela
  const numeroRecibo = `REC-${Date.now().toString().slice(-8)}`;

  // ─── Logo ───────────────────────────────────────────────────────────────
  try {
    doc.addImage(logoFly, 'JPEG', pageWidth / 2 - 18, y, 36, 36);
    y += 42;
  } catch {
    y += 5;
  }

  // ─── Cabeçalho empresa ──────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(nomeEmpresa, pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`CNPJ: ${cnpj}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(endereco, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`Tel: ${telefone}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // ─── Linha divisória ────────────────────────────────────────────────────
  doc.setDrawColor(14, 165, 233); // sky-500
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ─── Título recibo ──────────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE PAGAMENTO', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Nº ${numeroRecibo}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // ─── Caixa de dados do pagamento ────────────────────────────────────────
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 48, 3, 3, 'FD');

  const xLeft = margin + 6;
  const xRight = pageWidth / 2 + 4;
  let yBox = y + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(14, 116, 144); // cyan-700
  doc.text('VALOR RECEBIDO', xLeft, yBox);
  doc.text('DATA DO PAGAMENTO', xRight, yBox);
  yBox += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(21, 128, 61); // green-700
  const valorStr = `R$ ${(parcela.valor_parcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  doc.text(valorStr, xLeft, yBox);

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const dataPag = parcela.data_pagamento
    ? format(new Date(parcela.data_pagamento + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
    : format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  doc.text(dataPag, xRight, yBox);
  yBox += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(14, 116, 144);
  doc.text('FORMA DE PAGAMENTO', xLeft, yBox);
  doc.text('PARCELA', xRight, yBox);
  yBox += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(parcela.forma_pagamento || 'PIX', xLeft, yBox);
  doc.text(`${parcela.numero_parcela || 1} / ${parcela.total_parcelas || 1}`, xRight, yBox);

  y += 56;

  // ─── Dados do cliente ───────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(14, 116, 144);
  doc.text('DADOS DO CLIENTE', margin, y);
  y += 2;
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Nome: ${cliente?.nome_completo || '—'}`, margin, y);
  y += 6;
  doc.text(`CPF: ${cliente?.cpf || '—'}   Telefone: ${cliente?.telefone || '—'}`, margin, y);
  y += 6;
  if (cliente?.email) {
    doc.text(`E-mail: ${cliente.email}`, margin, y);
    y += 6;
  }

  // ─── Dados da viagem ────────────────────────────────────────────────────
  if (viagem) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(14, 116, 144);
    doc.text('VIAGEM REFERENTE', margin, y);
    y += 2;
    doc.setDrawColor(186, 230, 253);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`${viagem.nome || viagem.destino || '—'}`, margin, y);
    y += 6;

    if (viagem.data_saida) {
      const saida = format(new Date(viagem.data_saida + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });
      const retorno = viagem.data_retorno
        ? format(new Date(viagem.data_retorno + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
        : '—';
      doc.text(`Saída: ${saida}   Retorno: ${retorno}`, margin, y);
      y += 6;
    }
  }

  // ─── Observações ────────────────────────────────────────────────────────
  if (parcela.observacoes) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Observações:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const linhas = doc.splitTextToSize(parcela.observacoes, pageWidth - margin * 2);
    doc.text(linhas, margin, y);
    y += linhas.length * 5;
  }

  // ─── Linha assinatura ───────────────────────────────────────────────────
  y = Math.max(y + 20, 220);
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + 70, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text(nomeEmpresa, margin, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('Recebedor', margin, y);

  // ─── Rodapé ─────────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(150);
  const agora = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Documento gerado em ${agora} pelo sistema ${nomeEmpresa}`, pageWidth / 2, 285, { align: 'center' });

  // Download
  const nomeCliente = cliente?.nome_completo?.replace(/\s+/g, '_') || 'Cliente';
  doc.save(`Recibo_${nomeCliente}_${numeroRecibo}.pdf`);
}
