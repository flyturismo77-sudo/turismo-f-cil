import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plane, Users, DollarSign, TrendingUp, Calendar, Bell, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { differenceInDays } from "date-fns";
import StatCard from "../components/dashboard/StatCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: () => base44.entities.Viagem.list("-created_date"),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list("-created_date"),
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: () => base44.entities.Pagamento.list("-data_pagamento"),
  });

  const viagensAtivas = viagens.filter(v => !v.arquivada);
  const totalReceita = pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0);
  const proximasViagens = viagensAtivas.filter(v => {
    if (!v.data_saida) return false;
    const dias = differenceInDays(new Date(v.data_saida), new Date());
    return dias >= 0 && dias <= 30;
  });

  const statusPagamento = [
    { name: 'Pago', value: clientes.filter(c => c.status_pagamento === 'Pago').length },
    { name: 'Parcial', value: clientes.filter(c => c.status_pagamento === 'Parcial').length },
    { name: 'Pendente', value: clientes.filter(c => c.status_pagamento === 'Pendente' || !c.status_pagamento).length },
  ].filter(item => item.value > 0);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  // Receita mensal chart data
  const receitaMensal = pagamentos.reduce((acc, p) => {
    if (!p.data_pagamento) return acc;
    const date = new Date(p.data_pagamento);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const label = meses[date.getMonth()];
    acc[key] = (acc[key] || { name: label, valor: 0 });
    acc[key].valor += p.valor || 0;
    return acc;
  }, {});
  const receitaData = Object.values(receitaMensal).slice(-6);

  // Alertas
  const alertas = [];
  viagensAtivas.forEach(viagem => {
    const vagasRestantes = (viagem.vagas_totais || 0) - (viagem.vagas_ocupadas || 0);
    if (vagasRestantes <= 10 && vagasRestantes > 0) {
      alertas.push({ tipo: 'warning', titulo: 'Vagas limitadas!', mensagem: `Restam ${vagasRestantes} vagas em "${viagem.nome}".` });
    }
    if (viagem.data_saida) {
      const dias = differenceInDays(new Date(viagem.data_saida), new Date());
      if (dias >= 0 && dias <= 5) {
        alertas.push({ tipo: 'info', titulo: 'Embarque próximo!', mensagem: `Faltam ${dias} dia(s) para "${viagem.nome}".` });
      }
    }
  });

  const sistemaNovo = viagens.length === 0 && clientes.length === 0;

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 text-lg">Bem-vindo ao painel de controle da Fly Turismo</p>
      </div>

      {sistemaNovo && (
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-900 font-bold text-lg">✅ Sistema Pronto!</AlertTitle>
          <AlertDescription className="text-green-700 mt-2">
            Comece criando sua primeira viagem na aba <strong>Viagens</strong>.
          </AlertDescription>
        </Alert>
      )}

      {alertas.length > 0 && (
        <div className="space-y-3">
          {alertas.map((alerta, index) => (
            <Alert key={index} className={`${alerta.tipo === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
              <Bell className="h-4 w-4" />
              <AlertTitle>{alerta.titulo}</AlertTitle>
              <AlertDescription>{alerta.mensagem}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* 4 Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Receita Total"
          value={`R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Em pagamentos recebidos"
          icon={DollarSign}
          gradient="from-green-400 to-green-600"
          delay={0}
        />
        <StatCard
          title="Viagens Ativas"
          value={viagensAtivas.length}
          subtitle={`${viagens.length} total`}
          icon={Plane}
          gradient="from-sky-400 to-blue-600"
          delay={0.1}
        />
        <StatCard
          title="Clientes Totais"
          value={clientes.length}
          subtitle={`${clientes.filter(c => c.status_pagamento === 'Pendente' || !c.status_pagamento).length} pendentes`}
          icon={Users}
          gradient="from-purple-400 to-purple-600"
          delay={0.2}
        />
        <StatCard
          title="Próximas Viagens"
          value={proximasViagens.length}
          subtitle="Nos próximos 30 dias"
          icon={Calendar}
          gradient="from-amber-400 to-orange-600"
          delay={0.3}
        />
      </div>

      {!sistemaNovo && (
        <>
          {/* Gráficos */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-xl border-none">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Receita Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {receitaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={receitaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(v) => `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                      <Bar dataKey="valor" fill="#10b981" name="Receita" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">Nenhum pagamento registrado</div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-xl border-none">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-600" />
                  Status de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {statusPagamento.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusPagamento}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {statusPagamento.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">Nenhum dado disponível</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Atividades Recentes */}
          <RecentActivity 
            viagens={viagensAtivas}
            clientes={clientes}
            pagamentos={pagamentos}
          />
        </>
      )}
    </div>
  );
}
