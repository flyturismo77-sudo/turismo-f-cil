import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Circle, Users, MapPin, Search, Plane, ClipboardList, QrCode, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";

export default function CheckinEmbarque() {
  const [viagemSelecionada, setViagemSelecionada] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroLocal, setFiltroLocal] = useState("todos");
  const [clienteQR, setClienteQR] = useState(null);

  const { data: viagens = [] } = useQuery({
    queryKey: ["viagens-checkin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viagens")
        .select("id, nome, data_saida, status")
        .eq("arquivada", false)
        .order("data_saida", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-checkin", viagemSelecionada],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome_completo, cpf, telefone, poltrona, local_embarque, status_pagamento, observacoes, e_crianca_colo, cor_grupo, numero_grupo, sexo")
        .eq("id_viagem", viagemSelecionada)
        .order("local_embarque", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!viagemSelecionada,
  });

  const storageKey = `checkin_${viagemSelecionada}`;
  const [embarcados, setEmbarcados] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
    catch { return {}; }
  });

  const toggleEmbarque = (clienteId) => {
    setEmbarcados(prev => {
      const novo = { ...prev, [clienteId]: !prev[clienteId] };
      localStorage.setItem(storageKey, JSON.stringify(novo));
      return novo;
    });
  };

  React.useEffect(() => {
    if (viagemSelecionada) {
      try { setEmbarcados(JSON.parse(localStorage.getItem(`checkin_${viagemSelecionada}`) || "{}")); }
      catch { setEmbarcados({}); }
    }
  }, [viagemSelecionada]);

  const locaisEmbarque = [...new Set(clientes.map(c => c.local_embarque).filter(Boolean))];

  const clientesFiltrados = clientes.filter(c => {
    const matchBusca = !busca ||
      c.nome_completo?.toLowerCase().includes(busca.toLowerCase()) ||
      c.cpf?.includes(busca) ||
      c.telefone?.includes(busca);
    const matchLocal = filtroLocal === "todos" || c.local_embarque === filtroLocal;
    return matchBusca && matchLocal;
  });

  const totalEmbarcados = clientes.filter(c => embarcados[c.id]).length;
  const totalPendentes = clientes.length - totalEmbarcados;
  const viagemInfo = viagens.find(v => v.id === viagemSelecionada);

  const getCorDisplay = (cor, grupo) => {
    if (!cor) return "";
    const numGrupo = grupo || 1;
    const cores = {
      vermelho: ["bg-red-300", "bg-red-500", "bg-red-700", "bg-red-900"],
      azul: ["bg-blue-300", "bg-blue-500", "bg-blue-700", "bg-blue-900"],
      verde: ["bg-green-300", "bg-green-500", "bg-green-700", "bg-green-900"],
      amarelo: ["bg-yellow-300", "bg-yellow-500", "bg-yellow-700", "bg-yellow-900"],
      roxo: ["bg-purple-300", "bg-purple-500", "bg-purple-700", "bg-purple-900"],
      rosa: ["bg-pink-300", "bg-pink-500", "bg-pink-700", "bg-pink-900"],
      laranja: ["bg-orange-300", "bg-orange-500", "bg-orange-700", "bg-orange-900"],
      marrom: ["bg-amber-600", "bg-amber-700", "bg-amber-800", "bg-amber-900"],
      cinza: ["bg-gray-300", "bg-gray-500", "bg-gray-700", "bg-gray-900"],
    };
    return cores[cor]?.[(numGrupo - 1) % 4] || "";
  };

  // Gerar dados do QR code do passageiro
  const gerarDadosQR = (cliente, viagem) => {
    const dados = {
      nome: cliente.nome_completo,
      cpf: cliente.cpf || "—",
      poltrona: cliente.poltrona || "—",
      local: cliente.local_embarque || "—",
      viagem: viagem?.nome || "—",
      data: viagem?.data_saida ? format(parseISO(viagem.data_saida), "dd/MM/yyyy") : "—",
    };
    return JSON.stringify(dados);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Check-in de Embarque</h2>
        <p className="text-muted-foreground mt-1">Controle de presença e QR Code por passageiro</p>
      </div>

      {/* Seleção de viagem */}
      <Card>
        <CardContent className="p-4">
          <Select value={viagemSelecionada} onValueChange={setViagemSelecionada}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma viagem para iniciar o check-in..." />
            </SelectTrigger>
            <SelectContent className="z-[9999] bg-popover">
              {viagens.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  {v.nome} {v.data_saida && `— ${format(parseISO(v.data_saida), "dd/MM/yyyy", { locale: ptBR })}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {viagemSelecionada && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{clientes.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{totalEmbarcados}</p>
                <p className="text-xs text-muted-foreground mt-1">Embarcados ✅</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalPendentes}</p>
                <p className="text-xs text-muted-foreground mt-1">Aguardando</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-foreground">
                  {clientes.length > 0 ? Math.round((totalEmbarcados / clientes.length) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Progresso</p>
              </CardContent>
            </Card>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${clientes.length > 0 ? (totalEmbarcados / clientes.length) * 100 : 0}%` }}
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar passageiro..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroLocal} onValueChange={setFiltroLocal}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-popover">
                <SelectItem value="todos">Todos os locais</SelectItem>
                {locaisEmbarque.map(l => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
              onClick={() => {
                const todos = {};
                clientes.forEach(c => { todos[c.id] = true; });
                setEmbarcados(todos);
                localStorage.setItem(`checkin_${viagemSelecionada}`, JSON.stringify(todos));
              }}
            >
              ✅ Marcar todos
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => {
                setEmbarcados({});
                localStorage.setItem(`checkin_${viagemSelecionada}`, "{}");
              }}
            >
              Limpar
            </Button>
          </div>

          {/* Lista por local de embarque */}
          {locaisEmbarque.length > 0 && filtroLocal === "todos" ? (
            locaisEmbarque.map(local => {
              const clientesLocal = clientesFiltrados.filter(c => c.local_embarque === local);
              if (clientesLocal.length === 0) return null;
              const embarcadosLocal = clientesLocal.filter(c => embarcados[c.id]).length;
              return (
                <Card key={local}>
                  <CardHeader className="border-b border-border pb-3">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sky-500" />
                        {local}
                      </span>
                      <Badge variant="outline">{embarcadosLocal}/{clientesLocal.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {clientesLocal.map(c => (
                      <ClienteCheckinRow
                        key={c.id}
                        cliente={c}
                        embarcado={!!embarcados[c.id]}
                        onToggle={() => toggleEmbarque(c.id)}
                        onQR={() => setClienteQR(c)}
                        getCorDisplay={getCorDisplay}
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-3 space-y-2">
                {clientesFiltrados.map(c => (
                  <ClienteCheckinRow
                    key={c.id}
                    cliente={c}
                    embarcado={!!embarcados[c.id]}
                    onToggle={() => toggleEmbarque(c.id)}
                    onQR={() => setClienteQR(c)}
                    getCorDisplay={getCorDisplay}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {clientesFiltrados.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum passageiro encontrado</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!viagemSelecionada && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Selecione uma viagem para iniciar o check-in</p>
          </CardContent>
        </Card>
      )}

      {/* Modal QR Code */}
      <Dialog open={!!clienteQR} onOpenChange={() => setClienteQR(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-foreground">QR Code do Passageiro</DialogTitle>
          </DialogHeader>
          {clienteQR && (
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-border">
                <QRCodeSVG
                  value={gerarDadosQR(clienteQR, viagemInfo)}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="text-center space-y-1 w-full">
                <p className="font-bold text-lg text-foreground">{clienteQR.nome_completo}</p>
                {clienteQR.poltrona && (
                  <Badge className="bg-sky-500 text-white text-sm px-3 py-1">
                    Poltrona {clienteQR.poltrona}
                  </Badge>
                )}
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm text-muted-foreground">
                  {clienteQR.cpf && (
                    <div className="bg-muted rounded-lg p-2 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide">CPF</p>
                      <p className="font-medium text-foreground">{clienteQR.cpf}</p>
                    </div>
                  )}
                  {clienteQR.local_embarque && (
                    <div className="bg-muted rounded-lg p-2 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wide">Embarque</p>
                      <p className="font-medium text-foreground truncate">{clienteQR.local_embarque}</p>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Apresente este QR Code no embarque para confirmação rápida
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClienteCheckinRow({ cliente, embarcado, onToggle, onQR, getCorDisplay }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        embarcado
          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30"
          : "border-border hover:bg-muted/50"
      }`}
    >
      <div className="cursor-pointer" onClick={onToggle}>
        {embarcado
          ? <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
          : <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
        }
      </div>
      {cliente.cor_grupo && (
        <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getCorDisplay(cliente.cor_grupo, cliente.numero_grupo)}`} />
      )}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
        <p className={`font-medium truncate ${embarcado ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>
          {cliente.nome_completo}
          {cliente.e_crianca_colo && <span className="ml-2 text-xs text-purple-500">(colo)</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {cliente.poltrona && `Poltrona ${cliente.poltrona} · `}
          {cliente.telefone}
        </p>
      </div>
      <Badge className={
        cliente.status_pagamento === "Pago" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" :
        cliente.status_pagamento === "Parcial" ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400" :
        "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
      }>
        {cliente.status_pagamento}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
        onClick={(e) => { e.stopPropagation(); onQR(); }}
        title="Ver QR Code"
      >
        <QrCode className="w-4 h-4" />
      </Button>
    </div>
  );
}
