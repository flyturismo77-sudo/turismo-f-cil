import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Plane, Users, DollarSign, TrendingUp, Calendar, Bell, CheckCircle, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { differenceInDays } from "date-fns";
import StatCard from "../components/dashboard/StatCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const { data: viagens = [] } = useQuery({
    queryKey: ['viagens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viagens')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    retry: 2,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    retry: 2,
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .order('data_pagamento', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    retry: 2,
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

  const COLORS = ['#34d399', '#fbbf24', '#f87171'];

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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
            Bem-vindo de volta! 👋
          </h2>
          <p className="text-white/80 text-sm mt-1.5 max-w-lg">
            Aqui está um resumo do seu sistema de gestão de viagens.
          </p>
        </div>
      </div>

      {sistemaNovo && (
        <Alert className="bg-emerald-50 border-emerald-200 rounded-xl">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <AlertTitle className="text-slate-800 font-bold text-lg">✅ Sistema Pronto!</AlertTitle>
          <AlertDescription className="text-slate-500 mt-2">
            Comece criando sua primeira viagem na aba <strong className="text-sky-500">Viagens</strong>.
          </AlertDescription>
        </Alert>
      )}

      {alertas.length > 0 && (
        <div className="space-y-3">
          {alertas.map((alerta, index) => (
            <Alert key={index} className={`rounded-xl ${alerta.tipo === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-sky-50 border-sky-200'}`}>
              <Bell className={`h-4 w-4 ${alerta.tipo === 'warning' ? 'text-amber-500' : 'text-sky-500'}`} />
              <AlertTitle className="text-slate-700">{alerta.titulo}</AlertTitle>
              <AlertDescription className="text-slate-500">{alerta.mensagem}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Receita Total"
          value={`R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle="Em pagamentos recebidos"
          icon={DollarSign}
          gradient="from-emerald-400 to-emerald-500"
          delay={0}
        />
        <StatCard
          title="Viagens Ativas"
          value={viagensAtivas.length}
          subtitle={`${viagens.length} total`}
          icon={Plane}
          gradient="from-sky-400 to-blue-500"
          delay={0.1}
        />
        <StatCard
          title="Clientes Totais"
          value={clientes.length}
          subtitle={`${clientes.filter(c => c.status_pagamento === 'Pendente' || !c.status_pagamento).length} pendentes`}
          icon={Users}
          gradient="from-violet-400 to-violet-500"
          delay={0.2}
        />
        <StatCard
          title="Próximas Viagens"
          value={proximasViagens.length}
          subtitle="Nos próximos 30 dias"
          icon={Calendar}
          gradient="from-amber-400 to-orange-500"
          delay={0.3}
        />
      </div>

      {!sistemaNovo && (
        <>
          <div className="grid lg:grid-cols-2 gap-5">
            <Card className="shadow-sm border-slate-200/60 bg-white">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Receita Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {receitaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={receitaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip 
                        formatter={(v) => `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="valor" fill="#38bdf8" name="Receita" radius={[8,8,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400">Nenhum pagamento registrado</div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200/60 bg-white">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-400" />
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
                  <div className="h-64 flex items-center justify-center text-slate-400">Nenhum dado disponível</div>
                )}
              </CardContent>
            </Card>
          </div>

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
