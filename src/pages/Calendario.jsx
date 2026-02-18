import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plane, Users, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Calendario() {
  const [mesAtual, setMesAtual] = useState(new Date());

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

  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual),
  });

  // Padding para alinhar o calendário com a semana
  const primeiroDia = startOfMonth(mesAtual).getDay();
  const diasVazios = Array(primeiroDia).fill(null);

  const getViagensDoDia = (dia) => {
    return viagens.filter((v) => {
      if (!v.data_saida && !v.data_retorno) return false;
      const saida = v.data_saida ? parseISO(v.data_saida) : null;
      const retorno = v.data_retorno ? parseISO(v.data_retorno) : null;
      if (saida && isSameDay(saida, dia)) return true;
      if (retorno && isSameDay(retorno, dia)) return true;
      return false;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmada": return "bg-green-500";
      case "Em Andamento": return "bg-blue-500";
      case "Planejamento": return "bg-amber-500";
      case "Concluída": return "bg-slate-400";
      default: return "bg-sky-500";
    }
  };

  const viagensDoMes = viagens.filter((v) => {
    if (!v.data_saida) return false;
    const saida = parseISO(v.data_saida);
    return isSameMonth(saida, mesAtual);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Calendário de Viagens</h2>
          <p className="text-muted-foreground mt-1">Visualize todas as saídas e retornos</p>
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

      {/* Resumo do mês */}
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
              <p className="text-xs text-muted-foreground">Passageiros no mês</p>
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

      {/* Grid do calendário */}
      <Card>
        <CardContent className="p-4">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Células */}
          <div className="grid grid-cols-7 gap-1">
            {diasVazios.map((_, i) => (
              <div key={`vazio-${i}`} />
            ))}

            {diasDoMes.map((dia) => {
              const viagensDia = getViagensDoDia(dia);
              const ehHoje = isToday(dia);

              return (
                <div
                  key={dia.toString()}
                  className={`min-h-[90px] rounded-xl p-2 border transition-colors ${
                    ehHoje
                      ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <span className={`text-xs font-semibold ${
                    ehHoje ? "text-sky-500" : "text-muted-foreground"
                  }`}>
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
                          title={`${v.nome} - ${isRetorno ? "Retorno" : "Saída"}`}
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

      {/* Lista de viagens do mês */}
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
    </div>
  );
}
