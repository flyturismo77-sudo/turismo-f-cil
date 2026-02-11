import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, CheckCircle, Loader2, Plane, XCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';

export default function FormularioContrato() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [passageiros, setPassageiros] = useState([
    { nome_completo: '', cpf: '', telefone: '' }
  ]);
  const [formData, setFormData] = useState({
    id_viagem: '',
    nome_completo: '',
    rg: '',
    cpf: '',
    sexo: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    forma_pagamento: 'À Vista',
    numero_parcelas: 1,
    possui_crianca_colo: false,
    nome_crianca_colo: '',
    idade_crianca_colo: 0,
    desconto: 0
  });

  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens-form'],
    queryFn: () => base44.entities.Viagem.filter({ status: 'Aberta' }),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const formulario = await base44.entities.FormularioContrato.create(data);
      
      // Enviar email de confirmação (funcionalidade futura)
      try {
        await base44.integrations.Core.SendEmail({
          to: data.email,
          subject: `Confirmação de envio do formulário – Fly Turismo ✈️`,
          body: `Olá, ${data.nome_completo}!\n\nRecebemos com sucesso o seu formulário de cadastro para a viagem com a Fly Turismo.\n\nEquipe Fly Turismo`
        });
      } catch (emailErr) {
        console.warn('Email não enviado:', emailErr);
      }

      return formulario;
    },
    onSuccess: () => {
      setSuccess(true);
      setError(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: () => {
      setError(true);
      setSuccess(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const adicionarPassageiro = () => {
    setPassageiros([...passageiros, { nome_completo: '', cpf: '', telefone: '' }]);
  };

  const removerPassageiro = (index) => {
    if (passageiros.length > 1) {
      setPassageiros(passageiros.filter((_, i) => i !== index));
    }
  };

  const updatePassageiro = (index, field, value) => {
    const novosPassageiros = [...passageiros];
    novosPassageiros[index][field] = value;
    setPassageiros(novosPassageiros);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      passageiros: passageiros.filter(p => p.nome_completo && p.cpf)
    });
  };

  const viagemSelecionada = viagens.find(v => v.id === formData.id_viagem);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Navbar />
        <section className="py-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-none shadow-2xl">
              <CardContent className="p-12 text-center">
                <XCircle className="w-20 h-20 mx-auto mb-4 text-red-500" />
                <h2 className="text-3xl font-bold text-gray-900 mb-3">❌ Ops! Algo deu errado.</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Não foi possível enviar suas informações no momento.
                </p>
                <p className="text-gray-600 mb-8">
                  Por favor, tente novamente em alguns minutos ou entre em contato conosco pelo WhatsApp <strong>(38) 9755-2155</strong>.
                </p>
                <Button
                  onClick={() => {
                    setError(false);
                    setSuccess(false);
                  }}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                >
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Navbar />
        <section className="py-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-none shadow-2xl">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
                <h2 className="text-3xl font-bold text-gray-900 mb-3">✅ Formulário enviado com sucesso!</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Obrigado por preencher o formulário da Fly Turismo.
                </p>
                <p className="text-gray-600 mb-4">
                  Suas informações foram recebidas com sucesso e já estão sendo analisadas por nossa equipe.
                </p>
                <p className="text-gray-600 mb-4">
                  Em breve entraremos em contato através do e-mail ou WhatsApp informados no cadastro para confirmar os detalhes da sua viagem.
                </p>
                <p className="text-gray-600 mb-8">
                  Fique atento às nossas mensagens para não perder nenhuma atualização.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-700">
                    Caso tenha dúvidas ou precise corrigir alguma informação, entre em contato conosco pelo e-mail <strong>flyturismo77@gmail.com</strong> ou pelo WhatsApp <strong>(38) 9755-2155</strong>.
                  </p>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Um e-mail de confirmação foi enviado para <strong>{formData.email}</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to={createPageUrl('Home')}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Voltar para o site
                    </Button>
                  </Link>
                  <Link to={createPageUrl('ViagensPublico')}>
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-600">
                      Ver mais viagens
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Formulário de Contrato</h1>
            <p className="text-xl text-gray-600">Preencha os dados para sua reserva</p>
          </div>

          <Card className="border-none shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Selecione a Viagem</h3>
                  <div className="grid gap-3">
                    {viagens.map(viagem => (
                      <button
                        key={viagem.id}
                        type="button"
                        onClick={() => setFormData({...formData, id_viagem: viagem.id})}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          formData.id_viagem === viagem.id
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-gray-200 hover:border-sky-300'
                        }`}
                      >
                        <p className="font-bold text-gray-900">{viagem.nome}</p>
                        <p className="text-sm text-gray-600">{viagem.destino}</p>
                        <p className="text-lg font-bold text-sky-600 mt-1">
                          R$ {viagem.valor_total?.toLocaleString('pt-BR')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Dados do Contratante</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Nome Completo *</Label>
                      <Input
                        value={formData.nome_completo}
                        onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>RG *</Label>
                      <Input
                        value={formData.rg}
                        onChange={(e) => setFormData({...formData, rg: e.target.value})}
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
                      <Label>Data de Nascimento *</Label>
                      <Input
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone *</Label>
                      <Input
                        value={formData.telefone}
                        onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>E-mail *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Endereço</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Rua *</Label>
                      <Input
                        value={formData.rua}
                        onChange={(e) => setFormData({...formData, rua: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Número *</Label>
                      <Input
                        value={formData.numero}
                        onChange={(e) => setFormData({...formData, numero: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bairro *</Label>
                      <Input
                        value={formData.bairro}
                        onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                        required
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Cidade *</Label>
                      <Input
                        value={formData.cidade}
                        onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Informações de Pagamento</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Forma de Pagamento *</Label>
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
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.forma_pagamento === 'Parcelado' && (
                      <div className="space-y-2">
                        <Label>Número de Parcelas *</Label>
                        <Select 
                          value={formData.numero_parcelas.toString()} 
                          onValueChange={(value) => setFormData({...formData, numero_parcelas: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                              <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Desconto (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.desconto}
                        onChange={(e) => setFormData({...formData, desconto: parseFloat(e.target.value) || 0})}
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6 mb-3">Criança de Colo</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="crianca_colo"
                        checked={formData.possui_crianca_colo}
                        onChange={(e) => setFormData({...formData, possui_crianca_colo: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="crianca_colo" className="cursor-pointer">
                        Possui criança de colo?
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
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Passageiros Adicionais</h3>
                    <Button
                      type="button"
                      onClick={adicionarPassageiro}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Passageiro
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {passageiros.map((passageiro, index) => (
                      <Card key={index} className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-900">Passageiro {index + 1}</h4>
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerPassageiro(index)}
                                className="text-red-600"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Nome Completo</Label>
                              <Input
                                value={passageiro.nome_completo}
                                onChange={(e) => updatePassageiro(index, 'nome_completo', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>CPF</Label>
                              <Input
                                value={passageiro.cpf}
                                onChange={(e) => updatePassageiro(index, 'cpf', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Telefone</Label>
                              <Input
                                value={passageiro.telefone}
                                onChange={(e) => updatePassageiro(index, 'telefone', e.target.value)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createMutation.isPending || !formData.id_viagem}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 h-12 text-base font-semibold"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Formulário'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}