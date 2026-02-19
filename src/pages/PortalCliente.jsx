import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Plane,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Phone,
  Mail,
  Bus,
  Home,
} from "lucide-react";
import logoFly from "@/assets/logo-fly-turismo.jpg";

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("T")[0].split("-");
  return `${day}/${m}/${y}`;
};

const statusColors = {
  "Pago": "bg-green-100 text-green-700",
  "Pendente": "bg-red-100 text-red-700",
  "Parcial": "bg-yellow-100 text-yellow-700",
};

const statusParcela = (parcela) => {
  if (parcela.status === "Pago") return { label: "Pago", color: "bg-green-100 text-green-700", icon: CheckCircle2 };
  const hoje = new Date();
  const venc = new Date(parcela.data_vencimento + "T00:00:00");
  if (venc < hoje) return { label: "Vencida", color: "bg-red-100 text-red-700", icon: AlertCircle };
  return { label: "Pendente", color: "bg-amber-100 text-amber-700", icon: Clock };
};

export default function PortalCliente() {
  const [params] = useSearchParams();
  const clienteId = params.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [viagem, setViagem] = useState(null);
  const [parcelas, setParcelas] = useState([]);
  const [config, setConfig] = useState(null);
  const [acompanhantes, setAcompanhantes] = useState([]);

  useEffect(() => {
    if (!clienteId) {
      setError("Link inválido.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [{ data: cli, error: cliErr }, { data: cfg }] = await Promise.all([
          supabase.from("clientes").select("*").eq("id", clienteId).maybeSingle(),
          supabase.from("configuracao_empresa").select("*").limit(1).maybeSingle(),
        ]);

        if (cliErr || !cli) { setError("Cliente não encontrado."); setLoading(false); return; }
        setCliente(cli);
        setConfig(cfg);

        const [{ data: vg }, { data: parc }, { data: acomps }] = await Promise.all([
          cli.id_viagem
            ? supabase.from("viagens").select("*").eq("id", cli.id_viagem).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase.from("parcelas").select("*").eq("id_cliente", clienteId).order("numero_parcela"),
          supabase.from("clientes").select("*").eq("id_cliente_principal", clienteId),
        ]);

        setViagem(vg);
        setParcelas(parc || []);
        setAcompanhantes(acomps || []);
      } catch (e) {
        setError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    })();
  }, [clienteId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Carregando seu portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700">{error}</h2>
          <p className="text-slate-500 mt-2">Verifique se o link é válido.</p>
        </div>
      </div>
    );
  }

  const totalPago = parcelas.reduce((s, p) => s + (p.status === "Pago" ? (p.valor_parcela || 0) : 0), 0);
  const totalPendente = (cliente.valor_total_pacote || 0) - totalPago;
  const percPago = cliente.valor_total_pacote > 0
    ? Math.min(100, Math.round((totalPago / cliente.valor_total_pacote) * 100))
    : 0;

  const nomeEmpresa = config?.nome_empresa || "Fly Turismo";
  const logoUrl = config?.logo_url || logoFly;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#162d4a] to-[#1e3a5f] text-white py-6 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-white">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{nomeEmpresa}</h1>
            <p className="text-sky-300 text-sm">Portal do Cliente</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Saudação */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
              <User className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">{cliente.nome_completo}</h2>
              <p className="text-slate-400 text-sm">Olá! Acompanhe sua viagem aqui.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {cliente.telefone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                {cliente.telefone}
              </div>
            )}
            {cliente.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="truncate">{cliente.email}</span>
              </div>
            )}
            {cliente.poltrona && (
              <div className="flex items-center gap-2 text-slate-600">
                <Bus className="w-4 h-4 text-slate-400" />
                Poltrona #{cliente.poltrona} {cliente.andar_onibus ? `(${cliente.andar_onibus})` : ""}
              </div>
            )}
            {cliente.local_embarque && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                {cliente.local_embarque}
              </div>
            )}
          </div>
        </div>

        {/* Dados da Viagem */}
        {viagem && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plane className="w-5 h-5 text-sky-500" />
              <h3 className="font-bold text-slate-700">Detalhes da Viagem</h3>
            </div>
            {viagem.imagem_url && (
              <img
                src={viagem.imagem_url}
                alt={viagem.nome}
                className="w-full h-36 object-cover rounded-xl mb-4"
              />
            )}
            <p className="text-lg font-bold text-slate-800">{viagem.nome}</p>
            <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
              <MapPin className="w-4 h-4" />
              {viagem.destino}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">Saída</p>
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  {fmtDate(viagem.data_saida)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">Retorno</p>
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  {fmtDate(viagem.data_retorno)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acompanhantes */}
        {acompanhantes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-700 mb-3">Acompanhantes</h3>
            <div className="space-y-2">
              {acompanhantes.map((a) => (
                <div key={a.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 text-sm">{a.nome_completo}</p>
                    {a.poltrona && (
                      <p className="text-xs text-slate-400">Poltrona #{a.poltrona}</p>
                    )}
                  </div>
                  <Badge className={statusColors[a.status_pagamento] || "bg-slate-100 text-slate-600"}>
                    {a.status_pagamento || "—"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo Financeiro */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-slate-700">Resumo Financeiro</h3>
          </div>

          {/* Barra de Progresso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-500 mb-1">
              <span>Progresso do Pagamento</span>
              <span className="font-semibold text-slate-700">{percPago}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-sky-400 to-green-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${percPago}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Total</p>
              <p className="font-bold text-slate-800 text-sm">{fmt(cliente.valor_total_pacote)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-600 mb-1">Pago</p>
              <p className="font-bold text-green-700 text-sm">{fmt(totalPago)}</p>
            </div>
            <div className={`rounded-xl p-3 ${totalPendente > 0 ? "bg-amber-50" : "bg-green-50"}`}>
              <p className={`text-xs mb-1 ${totalPendente > 0 ? "text-amber-600" : "text-green-600"}`}>
                {totalPendente > 0 ? "Restante" : "Quitado!"}
              </p>
              <p className={`font-bold text-sm ${totalPendente > 0 ? "text-amber-700" : "text-green-700"}`}>
                {fmt(Math.max(0, totalPendente))}
              </p>
            </div>
          </div>
        </div>

        {/* Parcelas */}
        {parcelas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-700 mb-4">Parcelas</h3>
            <div className="space-y-2">
              {parcelas.map((p) => {
                const st = statusParcela(p);
                const Icon = st.icon;
                return (
                  <div key={p.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${
                      st.label === "Pago" ? "text-green-500" :
                      st.label === "Vencida" ? "text-red-500" : "text-amber-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">
                        Parcela {p.numero_parcela}/{p.total_parcelas}
                      </p>
                      <p className="text-xs text-slate-400">
                        Venc: {fmtDate(p.data_vencimento)}
                        {p.data_pagamento && ` · Pago: ${fmtDate(p.data_pagamento)}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-800">{fmt(p.valor_parcela)}</p>
                      <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Endereço */}
        {(cliente.rua || cliente.cidade) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-5 h-5 text-sky-500" />
              <h3 className="font-bold text-slate-700">Endereço</h3>
            </div>
            <p className="text-slate-600 text-sm">
              {[cliente.rua, cliente.numero, cliente.bairro, cliente.cidade, cliente.estado]
                .filter(Boolean).join(", ")}
            </p>
          </div>
        )}

        {/* Rodapé */}
        <div className="text-center text-xs text-slate-400 pb-8 pt-2">
          <p>{nomeEmpresa} · Portal do Cliente</p>
          <p className="mt-1">Este link é pessoal e intransferível.</p>
        </div>
      </div>
    </div>
  );
}

