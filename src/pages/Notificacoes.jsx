import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Clock, Plane, Users, TrendingDown, CheckCircle, FileText } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Notificacoes() {
  const hoje = new Date().toISOString().split("T")[0];

  const { data: parcelas = [] } = useQuery({
    queryKey: ["parcelas-notif"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelas")
        .select("*, clientes(nome_completo, id_viagem)")
        .eq("status", "Pendente")
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: viagens = [] } = useQuery({
    queryKey: ["viagens-notif"],
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

  const { data: formularios = [] } = useQuery({
    queryKey: ["formularios-notif"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formularios_contrato")
        .select("id, nome_completo, created_at, status")
        .eq("status", "Pendente")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Parcelas vencidas (atrasadas)
  const parcelasVencidas = parcelas.filter(p => p.data_vencimento && p.data_vencimento < hoje);
  // Parcelas vencendo em até 7 dias
  const parcelasProximas = parcelas.filter(p => {
    if (!p.data_vencimento || p.data_vencimento < hoje) return false;
    const dias = differenceInDays(parseISO(p.data_vencimento), new Date());
    return dias <= 7;
  });
  // Viagens em 7 dias
  const viagensProximas = viagens.filter(v => {
    if (!v.data_saida) return false;
    const dias = differenceInDays(parseISO(v.data_saida), new Date());
    return dias >= 0 && dias <= 7;
  });
  // Viagens com vagas limitadas (≤ 10 vagas)
  const viagensVagasLimitadas = viagens.filter(v => {
    const restantes = (v.vagas_totais || 0) - (v.vagas_ocupadas || 0);
    return restantes >= 0 && restantes <= 10;
  });

  const totalAlertas = parcelasVencidas.length + parcelasProximas.length + viagensProximas.length + formularios.length + viagensVagasLimitadas.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-sky-500" />
            Central de Notificações
          </h2>
          <p className="text-muted-foreground mt-1">
            {totalAlertas === 0 ? "Tudo em ordem! ✅" : `${totalAlertas} alerta(s) requerem atenção`}
          </p>
        </div>
        {totalAlertas === 0 && (
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        )}
      </div>

      {/* Parcelas vencidas */}
      {parcelasVencidas.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="border-b border-red-100 dark:border-red-900 pb-3">
            <CardTitle className="text-base font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Parcelas Vencidas ({parcelasVencidas.length})
              <Badge className="bg-red-500 text-white ml-auto">URGENTE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {parcelasVencidas.slice(0, 10).map((p, i) => {
              const diasAtraso = differenceInDays(new Date(), parseISO(p.data_vencimento));
              return (
                <div key={p.id} className={`flex items-center gap-3 p-4 ${i < parcelasVencidas.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{p.clientes?.nome_completo || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      Parcela {p.numero_parcela}/{p.total_parcelas} · Venceu {format(parseISO(p.data_vencimento), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-red-600 dark:text-red-400">
                      R$ {(p.valor_parcela || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-red-500">{diasAtraso} dia(s) atraso</p>
                  </div>
                </div>
              );
            })}
            {parcelasVencidas.length > 10 && (
              <div className="p-4 text-center">
                <Link to={createPageUrl("Recebimentos")}>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                    Ver todas ({parcelasVencidas.length})
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parcelas vencendo em breve */}
      {parcelasProximas.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="border-b border-amber-100 dark:border-amber-900 pb-3">
            <CardTitle className="text-base font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Vencem nos Próximos 7 Dias ({parcelasProximas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {parcelasProximas.map((p, i) => {
              const dias = differenceInDays(parseISO(p.data_vencimento), new Date());
              return (
                <div key={p.id} className={`flex items-center gap-3 p-4 ${i < parcelasProximas.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{p.clientes?.nome_completo || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      Parcela {p.numero_parcela}/{p.total_parcelas} · Vence {format(parseISO(p.data_vencimento), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-amber-600 dark:text-amber-400">
                      R$ {(p.valor_parcela || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-amber-500">em {dias} dia(s)</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Embarques em 7 dias */}
      {viagensProximas.length > 0 && (
        <Card className="border-sky-200 dark:border-sky-800">
          <CardHeader className="border-b border-sky-100 dark:border-sky-900 pb-3">
            <CardTitle className="text-base font-bold text-sky-700 dark:text-sky-400 flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Embarques nos Próximos 7 Dias ({viagensProximas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {viagensProximas.map((v, i) => {
              const dias = differenceInDays(parseISO(v.data_saida), new Date());
              return (
                <Link
                  key={v.id}
                  to={`${createPageUrl("DetalhesViagem")}?id=${v.id}`}
                  className={`flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${i < viagensProximas.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{v.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.destino} · {format(parseISO(v.data_saida), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <Badge className="bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400">
                    {dias === 0 ? "Hoje!" : `${dias} dia(s)`}
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Vagas limitadas */}
      {viagensVagasLimitadas.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="border-b border-purple-100 dark:border-purple-900 pb-3">
            <CardTitle className="text-base font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Vagas Quase Esgotadas ({viagensVagasLimitadas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {viagensVagasLimitadas.map((v, i) => {
              const restantes = (v.vagas_totais || 0) - (v.vagas_ocupadas || 0);
              const pct = v.vagas_totais > 0 ? Math.round(((v.vagas_ocupadas || 0) / v.vagas_totais) * 100) : 0;
              return (
                <Link
                  key={v.id}
                  to={`${createPageUrl("DetalhesViagem")}?id=${v.id}`}
                  className={`flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${i < viagensVagasLimitadas.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{v.nome}</p>
                    <p className="text-xs text-muted-foreground">{v.destino}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600 dark:text-purple-400">{restantes} vagas</p>
                    <p className="text-xs text-muted-foreground">{pct}% ocupado</p>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Formulários pendentes */}
      {formularios.length > 0 && (
        <Card className="border-violet-200 dark:border-violet-800">
          <CardHeader className="border-b border-violet-100 dark:border-violet-900 pb-3">
            <CardTitle className="text-base font-bold text-violet-700 dark:text-violet-400 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Formulários Aguardando Processamento ({formularios.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {formularios.slice(0, 5).map((f, i) => (
              <div key={f.id} className={`flex items-center gap-3 p-4 ${i < Math.min(formularios.length, 5) - 1 ? "border-b border-border" : ""}`}>
                <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{f.nome_completo}</p>
                  <p className="text-xs text-muted-foreground">
                    Recebido em {format(parseISO(f.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <Badge className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400">Pendente</Badge>
              </div>
            ))}
            {formularios.length > 5 && (
              <div className="p-4 text-center">
                <Link to={createPageUrl("Formularios")}>
                  <Button variant="outline" size="sm">Ver todos ({formularios.length})</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {totalAlertas === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-60" />
            <p className="text-lg font-semibold text-foreground">Tudo em ordem!</p>
            <p className="text-sm mt-1">Nenhuma notificação pendente no momento.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
