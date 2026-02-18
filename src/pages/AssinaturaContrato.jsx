import React, { useState, useEffect } from 'react';
import logoFly from '@/assets/logo-fly-turismo.jpg';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AssinaturaContrato() {
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('id');

  const [contrato, setContrato] = useState(null);
  const [viagem, setViagem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jaAssinado, setJaAssinado] = useState(false);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [confirmou, setConfirmou] = useState(false);
  const [assinando, setAssinando] = useState(false);
  const [assinadoAgora, setAssinadoAgora] = useState(false);

  useEffect(() => {
    if (!linkId) {
      setError('Link de assinatura inválido.');
      setLoading(false);
      return;
    }
    const buscarContrato = async () => {
      const { data, error: err } = await supabase
        .from('formularios_contrato')
        .select('*, viagens:id_viagem(nome, destino, data_saida, data_retorno)')
        .eq('link_assinatura', linkId)
        .maybeSingle();

      if (err || !data) {
        setError('Contrato não encontrado ou link inválido.');
      } else {
        setContrato(data);
        setViagem(data.viagens);
        if (data.assinatura_data) setJaAssinado(true);
        // Pré-preenche nome e CPF para facilitar
        setNome(data.nome_completo || '');
        setCpf(data.cpf || '');
      }
      setLoading(false);
    };
    buscarContrato();
  }, [linkId]);

  const normalizarCPF = (v) => v.replace(/\D/g, '');

  const handleAssinar = async () => {
    if (!nome.trim()) return alert('Informe seu nome completo.');
    if (normalizarCPF(cpf).length < 11) return alert('CPF inválido.');
    if (normalizarCPF(cpf) !== normalizarCPF(contrato.cpf || '')) {
      return alert('CPF não corresponde ao cadastro do contrato. Verifique e tente novamente.');
    }
    if (!confirmou) return alert('Você precisa confirmar que leu o contrato.');

    setAssinando(true);
    try {
      const { error: err } = await supabase
        .from('formularios_contrato')
        .update({
          assinatura_nome: nome.trim(),
          assinatura_cpf: normalizarCPF(cpf),
          assinatura_data: new Date().toISOString(),
          status: 'Assinado',
        })
        .eq('link_assinatura', linkId);

      if (err) throw err;
      setAssinadoAgora(true);
    } catch (e) {
      alert('Erro ao registrar assinatura. Tente novamente.');
    } finally {
      setAssinando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Link Inválido</h2>
            <p className="text-slate-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assinadoAgora) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-green-50 p-4">
        <Card className="max-w-md w-full border-green-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Contrato Assinado!</h2>
            <p className="text-slate-600 mb-4">
              Sua assinatura foi registrada com sucesso em{' '}
              <strong>{format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</strong>.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left text-sm">
              <p className="text-green-800 font-semibold mb-1">✅ Dados registrados:</p>
              <p className="text-green-700">Nome: {nome}</p>
              <p className="text-green-700">CPF: {cpf}</p>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Guarde este comprovante. Em caso de dúvidas, entre em contato com a agência.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (jaAssinado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-16 h-16 text-sky-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Contrato Já Assinado</h2>
            <p className="text-slate-500 mb-2">
              Este contrato já foi assinado em{' '}
              <strong>
                {format(new Date(contrato.assinatura_data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </strong>.
            </p>
            <p className="text-slate-500 text-sm">Assinado por: <strong>{contrato.assinatura_nome}</strong></p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dataSaida = viagem?.data_saida
    ? format(new Date(viagem.data_saida + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—';
  const dataRetorno = viagem?.data_retorno
    ? format(new Date(viagem.data_retorno + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <img src={logoFly} alt="Fly Turismo" className="w-20 h-20 object-cover rounded-2xl mx-auto mb-4 shadow-md" />
          <h1 className="text-2xl font-bold text-slate-800">Assinatura de Contrato</h1>
          <p className="text-slate-500 text-sm mt-1">Confirme seus dados para assinar eletronicamente</p>
        </div>

        {/* Resumo do contrato */}
        <Card className="border-sky-100 shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sky-700 font-semibold text-lg">
              <FileText className="w-5 h-5" />
              Resumo do Contrato
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Contratante</p>
                <p className="font-semibold text-slate-800">{contrato.nome_completo}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">CPF</p>
                <p className="font-semibold text-slate-800">{contrato.cpf || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Destino</p>
                <p className="font-semibold text-slate-800">{viagem?.destino || viagem?.nome || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Valor Total</p>
                <p className="font-semibold text-green-700 text-base">
                  R$ {Number(contrato.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Data de Saída</p>
                <p className="font-semibold text-slate-800">{dataSaida}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Data de Retorno</p>
                <p className="font-semibold text-slate-800">{dataRetorno}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">Pagamento</p>
                <p className="font-semibold text-slate-800">
                  {contrato.forma_pagamento} — {contrato.numero_parcelas}x parcela(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de assinatura */}
        <Card className="border-sky-100 shadow-md">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-sky-700 font-semibold text-lg">
              <ShieldCheck className="w-5 h-5" />
              Confirme sua Identidade para Assinar
            </div>

            <div className="space-y-1">
              <Label>Nome Completo *</Label>
              <Input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Digite seu nome completo exatamente como no contrato"
                className="bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label>CPF *</Label>
              <Input
                value={cpf}
                onChange={e => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="bg-white"
              />
              <p className="text-xs text-slate-400">Deve ser idêntico ao CPF cadastrado no contrato.</p>
            </div>

            {/* Termos */}
            <div className="bg-slate-50 border rounded-xl p-4 max-h-40 overflow-y-auto text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold mb-2">Declaro que:</p>
              <p>• Li e concordo com todas as cláusulas do contrato de viagem com a {contrato.nome_empresa || 'Fly Turismo'}.</p>
              <p>• As informações prestadas são verdadeiras e de minha responsabilidade.</p>
              <p>• Estou ciente dos valores, datas e condições de cancelamento descritos no contrato.</p>
              <p>• Esta assinatura eletrônica tem validade legal nos termos da Lei nº 14.063/2020.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmou}
                onChange={e => setConfirmou(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-sky-500"
              />
              <span className="text-sm text-slate-700">
                Li e concordo com os termos acima e confirmo minha identidade para assinar este contrato eletronicamente.
              </span>
            </label>

            <Button
              onClick={handleAssinar}
              disabled={assinando || !confirmou}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-3 text-base shadow-lg"
            >
              {assinando ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Registrando assinatura...</>
              ) : (
                <><ShieldCheck className="w-5 h-5 mr-2" />Assinar Contrato Eletronicamente</>
              )}
            </Button>

            <p className="text-center text-xs text-slate-400">
              🔒 Conexão segura. Sua assinatura será registrada com data, hora e dados de validação.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
