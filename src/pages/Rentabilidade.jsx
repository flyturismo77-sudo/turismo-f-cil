import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Plane, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function Rentabilidade() {
  const [viagemFiltro, setViagemFiltro] = useState("todas");

  const { data: viagens = [] } = useQuery({
    queryKey: ["viagens-rentabilidade"],
    queryFn: async () => {
      const { data, error } = await supabase.from("viagens").select("*").order("data_saida", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-rentabilidade"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("id, id_viagem, valor_total_pacote, valor_pago, status_pagamento");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: parcelas = [] } = useQuery({
    queryKey: ["parcelas-rentabilidade"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parcelas").select("id_viagem, valor_parcela, status");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: despesasEmpresa = [] } = useQuery({
    queryKey: ["despesas-empresa-rentabilidade"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pagamentos_empresa").select("id_viagem, valor");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: despesasPessoal = [] } = useQuery({
    queryKey: ["despesas-pessoal-rentabilidade"],
    queryFn: async () => {
      const { data, error } = await supabase.from("despesas_pessoal").select("id_viagem, valor, status");
      if (error) throw error;
      return data || [];
    },
  });

  const calcularRentabilidade = (viagem) => {
    const clientesViagem = clientes.filter(c => c.id_viagem === viagem.id);
    const parcelasViagem = parcelas.filter(p => p.id_viagem === viagem.id);
    const despEmpresa = despesasEmpresa.filter(d => d.id_viagem === viagem.id);
    const despPessoal = despesasPessoal.filter(d => d.id_viagem === viagem.id && d.status === "Pago");

    const receitaTotal = clientesViagem.reduce((s, c) => s + (c.valor_total_pacote || 0), 0);
    const receitaRecebida = parcelasViagem.filter(p => p.status === "Pago").reduce((s, p) => s + (p.valor_parcela || 0), 0)
      + clientesViagem.filter(c => c.status_pagamento === "Pago" && !parcelasViagem.some(p => p.status === "Pago")).reduce((s, c) => s + (c.valor_pago || 0), 0);
    const totalDespesas = despEmpresa.reduce((s, d) => s + (d.valor || 0), 0)
      + despPessoal.reduce((s, d) => s + (d.valor || 0), 0);
    const lucroEstimado = receitaTotal - totalDespesas;
    const margemLucro = receitaTotal > 0 ? (lucroEstimado / receitaTotal) * 100 : 0;

    return { receitaTotal, receitaRecebida, totalDespesas, lucroEstimado, margemLucro, passageiros: clientesViagem.length };
  };

  const dadosViagens = viagens.map(v => ({
    ...v,
    ...calcularRentabilidade(v),
  }));

  const viagensFiltradas = viagemFiltro === "todas" ? dadosViagens : dadosViagens.filter(v => v.id === viagemFiltro);

  const totalGeral = {
    receita: viagensFiltradas.reduce((s, v) => s + v.receitaTotal, 0),
    despesas: viagensFiltradas.reduce((s, v) => s + v.totalDespesas, 0),
    lucro: viagensFiltradas.reduce((s, v) => s + v.lucroEstimado, 0),
  };

  const chartData = dadosViagens.slice(0, 8).map(v => ({
    name: v.nome.slice(0, 12) + (v.nome.length > 12 ? "..." : ""),
    receita: v.receitaTotal,
    despesas: v.totalDespesas,
    lucro: v.lucroEstimado,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rentabilidade por Viagem</h2>
          <p className="text-muted-foreground mt-1">Receita, despesas e lucro consolidados</p>
        </div>
        <Select value={viagemFiltro} onValueChange={setViagemFiltro}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[9999] bg-popover">
            <SelectItem value="todas">Todas as viagens</SelectItem>
            {viagens.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-sky-500" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Receita Total Estimada</p>
            </div>
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{fmt(totalGeral.receita)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Total de Despesas</p>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{fmt(totalGeral.despesas)}</p>
          </CardContent>
        </Card>
        <Card className={`border-2 ${totalGeral.lucro >= 0 ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30" : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalGeral.lucro >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                {totalGeral.lucro >= 0
                  ? <TrendingUp className="w-5 h-5 text-green-500" />
                  : <TrendingDown className="w-5 h-5 text-red-500" />
                }
              </div>
              <p className="text-sm text-muted-foreground font-medium">Lucro Estimado</p>
            </div>
            <p className={`text-2xl font-bold ${totalGeral.lucro >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {fmt(totalGeral.lucro)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico comparativo */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              Comparativo por Viagem
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={v => fmt(v)}
                  contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="receita" fill="#38bdf8" name="Receita" radius={[6, 6, 0, 0]} />
                <Bar dataKey="despesas" fill="#f87171" name="Despesas" radius={[6, 6, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.lucro >= 0 ? "#34d399" : "#f87171"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela por viagem */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Plane className="w-5 h-5 text-sky-500" />
            Detalhamento por Viagem
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-semibold text-muted-foreground">Viagem</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Passageiros</th>
                  <th className="text-right p-4 font-semibold text-muted-foreground">Receita Estimada</th>
                  <th className="text-right p-4 font-semibold text-muted-foreground">Despesas</th>
                  <th className="text-right p-4 font-semibold text-muted-foreground">Lucro</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Margem</th>
                </tr>
              </thead>
              <tbody>
                {viagensFiltradas.map((v, i) => (
                  <tr key={v.id} className={`border-b border-border hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{v.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.data_saida && format(parseISO(v.data_saida), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="flex items-center justify-center gap-1 text-foreground">
                        <Users className="w-3 h-3" /> {v.passageiros}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-sky-600 dark:text-sky-400">{fmt(v.receitaTotal)}</td>
                    <td className="p-4 text-right font-medium text-red-600 dark:text-red-400">{fmt(v.totalDespesas)}</td>
                    <td className="p-4 text-right font-bold">
                      <span className={v.lucroEstimado >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                        {fmt(v.lucroEstimado)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={`${v.margemLucro >= 20 ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : v.margemLucro >= 0 ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"}`}>
                        {v.margemLucro.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
