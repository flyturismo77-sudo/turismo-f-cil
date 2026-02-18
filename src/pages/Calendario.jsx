import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft, ChevronRight, Plane, Users, Calendar, DollarSign,
  AlertTriangle, Clock, CheckCircle
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isSameMonth, addMonths, subMonths, isToday, parseISO, isBefore, startOfDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Calendario() {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [aba, setAba] = useState("viagens");

  const { data: viagens = [] } = useQuery({
    queryKey: ["viagens-calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viagens")
        .select("*")
        .eq("arquivada", false)
        .order("data_saida", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: parcelas = [] } = useQuery({
    queryKey: ["parcelas-calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelas")
        .select("id, data_vencimento, status, valor_parcela, numero_parcela, total_parcelas, id_cliente, id_viagem, clientes(nome_completo), viagens(nome)")
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual),
  });

  const primeiroDia = startOfMonth(mesAtual).getDay();
  const diasVazios = Array(primeiroDia).fill(null);
  const hoje = startOfDay(new Date());

  const getViagensDoDia = (dia) =>
    viagens.filter((v) => {
      const saida = v.data_saida ? parseISO(v.data_saida) : null;
      const retorno = v.data_retorno ? parseISO(v.data_retorno) : null;
      return (saida && isSameDay(saida, dia)) || (retorno && isSameDay(retorno, dia));
    });

  const getParcelasDoDia = (dia) =>
    parcelas.filter((p) => p.data_vencimento && isSameDay(parseISO(p.data_vencimento), dia));

  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmada": return "bg-green-500";
      case "Em Andamento": return "bg-blue-500";
      case "Planejamento": return "bg-amber-500";
      case "Concluída": return "bg-slate-400";
      default: return "bg-sky-500";
    }
  };

  const getParcelaColor = (parcela, dia) => {
    if (parcela.status === "Paga") return "bg-emerald-500";
    if (isBefore(parseISO(parcela.data_vencimento), hoje)) return "bg-red-500";
    return "bg-amber-500";
  };

  const viagensDoMes = viagens.filter((v) => {
    if (!v.data_saida) return false;
    return isSameMonth(parseISO(v.data_saida), mesAtual);
  });

  const parcelasDoMes = parcelas.filter((p) => {
    if (!p.data_vencimento) return false;
    return isSameMonth(parseISO(p.data_vencimento), mesAtual);
  });

  const parcelasVencidas = parcelasDoMes.filter(
    (p) => p.status === "Pendente" && isBefore(parseISO(p.data_vencimento), hoje)
  );
  const parcelasAVencer = parcelasDoMes.filter(
    (p) => p.status === "Pendente" && !isBefore(parseISO(p.data_vencimento), hoje)
  );
  const parcelasPagas = parcelasDoMes.filter((p) => p.status === "Paga");
  const totalVencido = parcelasVencidas.reduce((s, p) => s + (p.valor_parcela || 0), 0);
  const totalAVencer = parcelasAVencer.reduce((s, p) => s + (p.valor_parcela || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Calendário</h2>
          <p className="text-muted-foreground mt-1">Viagens e vencimentos de parcelas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMesAtual(subMonths(mesAtual, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-foreground capitalize min-w-[160px] text-center">
            {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setMesAtual(addMonths(mesAtual, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setMesAtual(new Date())} className="ml-2">
            Hoje
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={aba} onValueChange={setAba}>
        <TabsList className="bg-muted/60">
          <TabsTrigger value="viagens" className="gap-1.5">
            <Plane className="w-4 h-4" /> Viagens
          </TabsTrigger>
          <TabsTrigger value="parcelas" className="gap-1.5">
            <DollarSign className="w-4 h-4" /> Parcelas
            {parcelasVencidas.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {parcelasVencidas.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== ABA VIAGENS ===== */}
        <TabsContent value="viagens" className="space-y-5 mt-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{viagensDoMes.length}</p>
                  <p className="text-xs text-muted-foreground">Viagens no mês</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {viagensDoMes.reduce((s, v) => s + (v.vagas_ocupadas || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Passageiros</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {viagensDoMes.filter(v => v.status === "Confirmada").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Confirmadas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {viagensDoMes.filter(v => v.status === "Planejamento").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Planejamento</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {DIAS_SEMANA.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasVazios.map((_, i) => <div key={`vazio-${i}`} />)}
                {diasDoMes.map((dia) => {
                  const viagensDia = getViagensDoDia(dia);
                  const ehHoje = isToday(dia);
                  return (
                    <div
                      key={dia.toString()}
                      className={`min-h-[90px] rounded-xl p-2 border transition-colors ${
                        ehHoje ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <span className={`text-xs font-semibold ${ehHoje ? "text-sky-500" : "text-muted-foreground"}`}>
                        {format(dia, "d")}
                      </span>
                      <div className="mt-1 space-y-1">
                        {viagensDia.slice(0, 2).map((v) => {
                          const saida = v.data_saida ? parseISO(v.data_saida) : null;
                          const isRetorno = saida && !isSameDay(saida, dia);
                          return (
                            <Link
                              key={v.id}
                              to={`${createPageUrl("DetalhesViagem")}?id=${v.id}`}
                              className={`block text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white truncate leading-tight ${getStatusColor(v.status)}`}
                              title={`${v.nome} — ${isRetorno ? "Retorno" : "Saída"}`}
                            >
                              {isRetorno ? "↩ " : "✈ "}{v.nome}
                            </Link>
                          );
                        })}
                        {viagensDia.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{viagensDia.length - 2} mais</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {viagensDoMes.length > 0 && (
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Plane className="w-5 h-5 text-sky-500" />
                  Viagens em {format(mesAtual, "MMMM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {viagensDoMes.map((v, i) => {
                  const pct = v.vagas_totais > 0 ? Math.round(((v.vagas_ocupadas || 0) / v.vagas_totais) * 100) : 0;
                  return (
                    <Link
                      key={v.id}
                      to={`${createPageUrl("DetalhesViagem")}?id=${v.id}`}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${i < viagensDoMes.length - 1 ? "border-b border-border" : ""}`}
                    >
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(v.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{v.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.data_saida && format(parseISO(v.data_saida), "dd/MM")}
                          {v.data_retorno && ` → ${format(parseISO(v.data_retorno), "dd/MM")}`}
                          {" · "}{v.destino}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-foreground">{pct}%</p>
                        <p className="text-xs text-muted-foreground">{v.vagas_ocupadas || 0}/{v.vagas_totais} vagas</p>
                      </div>
                      <Badge className={`text-white ${getStatusColor(v.status)}`}>{v.status}</Badge>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {viagensDoMes.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma viagem programada para este mês</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== ABA PARCELAS ===== */}
        <TabsContent value="parcelas" className="space-y-5 mt-5">
          {/* Resumo do mês */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{parcelasVencidas.length}</p>
                  <p className="text-xs text-muted-foreground">
                    Vencidas · R$ {totalVencido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{parcelasAVencer.length}</p>
                  <p className="text-xs text-muted-foreground">
                    A vencer · R$ {totalAVencer.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{parcelasPagas.length}</p>
                  <p className="text-xs text-muted-foreground">
                    Pagas · R$ {parcelasPagas.reduce((s, p) => s + (p.valor_parcela || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendário de parcelas */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {DIAS_SEMANA.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasVazios.map((_, i) => <div key={`vazio-${i}`} />)}
                {diasDoMes.map((dia) => {
                  const parcelasDia = getParcelasDoDia(dia);
                  const ehHoje = isToday(dia);
                  const temVencida = parcelasDia.some(p => p.status === "Pendente" && isBefore(parseISO(p.data_vencimento), hoje));
                  const temPendente = parcelasDia.some(p => p.status === "Pendente" && !isBefore(parseISO(p.data_vencimento), hoje));

                  return (
                    <div
                      key={dia.toString()}
                      className={`min-h-[80px] rounded-xl p-2 border transition-colors ${
                        ehHoje
                          ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30"
                          : temVencida
                          ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <span className={`text-xs font-semibold ${ehHoje ? "text-sky-500" : temVencida ? "text-red-500" : "text-muted-foreground"}`}>
                        {format(dia, "d")}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {parcelasDia.slice(0, 2).map((p) => (
                          <div
                            key={p.id}
                            className={`text-[9px] font-medium px-1 py-0.5 rounded text-white truncate ${getParcelaColor(p, dia)}`}
                            title={`${p.clientes?.nome_completo} — R$ ${p.valor_parcela?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                          >
                            {p.clientes?.nome_completo?.split(" ")[0]}
                          </div>
                        ))}
                        {parcelasDia.length > 2 && (
                          <span className="text-[9px] text-muted-foreground">+{parcelasDia.length - 2}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legenda */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Vencida</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Pendente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Paga</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de vencimentos */}
          {parcelasVencidas.length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Parcelas Vencidas ({parcelasVencidas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {parcelasVencidas.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-4 p-4 ${i < parcelasVencidas.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{p.clientes?.nome_completo}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.viagens?.nome && `${p.viagens.nome} · `}
                        Parcela {p.numero_parcela}/{p.total_parcelas}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-red-600">
                        R$ {p.valor_parcela?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Venceu {format(parseISO(p.data_vencimento), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">Vencida</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {parcelasAVencer.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-base font-bold text-amber-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Próximos Vencimentos ({parcelasAVencer.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {parcelasAVencer.slice(0, 10).map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-4 p-4 ${i < Math.min(parcelasAVencer.length, 10) - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{p.clientes?.nome_completo}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.viagens?.nome && `${p.viagens.nome} · `}
                        Parcela {p.numero_parcela}/{p.total_parcelas}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground">
                        R$ {p.valor_parcela?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(p.data_vencimento), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">Pendente</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {parcelasDoMes.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma parcela para este mês</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
