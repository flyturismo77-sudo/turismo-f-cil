import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Archive, Plane } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViagemCard from "../components/viagens/ViagemCard";
import ViagemForm from "../components/viagens/ViagemForm";

export default function Viagens() {
  const [showForm, setShowForm] = useState(false);
  const [editingViagem, setEditingViagem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("ativas");
  const queryClient = useQueryClient();

  const { data: viagens = [], isLoading, error } = useQuery({
    queryKey: ['viagens'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Viagem.list("-created_date");
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.error("Erro ao carregar viagens:", err);
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      try {
        const viagem = await base44.entities.Viagem.create(data);
        if (!viagem || !viagem.id) throw new Error("Falha ao criar viagem");
        
        const totalAssentos = data.vagas_totais || 46;
        const modelo = data.modelo_onibus || 'LD';
        const assentos = [];
        
        if (modelo === 'VAN') {
          for (let i = 1; i <= totalAssentos; i++) {
            assentos.push({ numero_poltrona: i, id_viagem: viagem.id, andar: 'Primeiro Andar', posicao: i % 2 === 1 ? 'Janela' : 'Corredor', status: 'Disponível' });
          }
        } else if (modelo === 'VA_TUR') {
          for (let i = 1; i <= totalAssentos; i++) {
            assentos.push({ numero_poltrona: i, id_viagem: viagem.id, andar: i <= 48 ? 'Piso Superior' : 'Piso Inferior', posicao: i % 2 === 1 ? 'Janela' : 'Corredor', status: 'Disponível' });
          }
        } else if (modelo === 'DD_DS_TUR') {
          for (let i = 1; i <= totalAssentos; i++) {
            assentos.push({ numero_poltrona: i, id_viagem: viagem.id, andar: i <= 44 ? 'Piso Superior' : 'Piso Inferior', posicao: i % 2 === 1 ? 'Janela' : 'Corredor', status: 'Disponível' });
          }
        } else if (modelo === 'LD48') {
          // LD Deca Turismo - seats 1-22, 25-48 (no 23, 24)
          for (let i = 1; i <= 48; i++) {
            if (i === 23 || i === 24) continue;
            assentos.push({ numero_poltrona: i, id_viagem: viagem.id, andar: 'Piso Superior', posicao: i % 2 === 1 ? 'Janela' : 'Corredor', status: 'Disponível' });
          }
        } else if (modelo === 'JG_TURISMO_44') {
          for (let i = 1; i <= totalAssentos; i++) {
            assentos.push({ numero_poltrona: i, id_viagem: viagem.id, andar: 'Primeiro Andar', posicao: i % 2 === 1 ? 'Janela' : 'Corredor', status: 'Disponível' });
          }
        } else {
          for (let i = 1; i <= totalAssentos; i++) {
            assentos.push({ numero_poltrona: i, id_viagem: viagem.id, andar: 'Primeiro Andar', posicao: i % 2 === 1 ? 'Janela' : 'Corredor', status: 'Disponível' });
          }
        }
        
        if (assentos.length > 0) {
          try { await base44.entities.Assento.bulkCreate(assentos); } catch (err) { console.error("Erro ao criar assentos:", err); }
        }
        
        const quartos = [];
        for (let i = 1; i <= 26; i++) {
          quartos.push({ id_viagem: viagem.id, numero_quarto: i.toString(), capacidade: 4, ocupados: 0 });
        }
        if (quartos.length > 0) {
          try { await base44.entities.Quarto.bulkCreate(quartos); } catch (err) { console.error("Erro ao criar quartos:", err); }
        }
        
        return viagem;
      } catch (error) {
        console.error("Erro na criação da viagem:", error);
        throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries(['viagens']); setShowForm(false); setEditingViagem(null); },
    onError: (error) => { console.error("Erro ao criar viagem:", error); alert("Erro ao criar viagem. Tente novamente."); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Viagem.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['viagens']); setShowForm(false); setEditingViagem(null); },
    onError: (error) => { console.error("Erro ao atualizar viagem:", error); alert("Erro ao atualizar viagem. Tente novamente."); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Viagem.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['viagens']); },
    onError: (error) => { console.error("Erro ao deletar viagem:", error); alert("Erro ao deletar viagem. Tente novamente."); }
  });

  const arquivarMutation = useMutation({
    mutationFn: ({ id, arquivada }) => {
      const viagem = viagens.find(v => v.id === id);
      if (!viagem) throw new Error("Viagem não encontrada");
      return base44.entities.Viagem.update(id, { arquivada });
    },
    onSuccess: () => { queryClient.invalidateQueries(['viagens']); },
    onError: (error) => { console.error("Erro ao arquivar viagem:", error); alert("Erro ao arquivar viagem. Tente novamente."); }
  });

  const handleSubmit = (data) => {
    if (editingViagem) { updateMutation.mutate({ id: editingViagem.id, data }); }
    else { createMutation.mutate(data); }
  };

  const handleEdit = (viagem) => { setEditingViagem(viagem); setShowForm(true); };
  const handleDelete = (viagem) => { if (confirm(`Tem certeza que deseja excluir "${viagem.nome}"?`)) deleteMutation.mutate(viagem.id); };
  const handleArquivar = (viagem) => {
    const acao = viagem.arquivada ? 'restaurar' : 'arquivar';
    if (confirm(`Tem certeza que deseja ${acao} "${viagem.nome}"?`)) arquivarMutation.mutate({ id: viagem.id, arquivada: !viagem.arquivada });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <p className="text-destructive">Erro ao carregar viagens. Tente recarregar a página.</p>
        </div>
      </div>
    );
  }

  const viagensAtivas = viagens.filter(v => !v.arquivada);
  const viagensArquivadas = viagens.filter(v => v.arquivada);
  const filteredViagensAtivas = viagensAtivas.filter(v =>
    v.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.destino?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredViagensArquivadas = viagensArquivadas.filter(v =>
    v.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.destino?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EmptyState = ({ text }) => (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Plane className="w-8 h-8" />
      </div>
      <p className="font-medium">{text}</p>
      <p className="text-sm mt-1">Clique em "Nova Viagem" para começar</p>
    </div>
  );

  const SkeletonCards = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-border bg-card">
          <div className="h-44 bg-muted animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="h-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-muted-foreground mt-1">Gerencie todas as viagens da empresa</p>
        </div>
        <Button
          onClick={() => { setEditingViagem(null); setShowForm(true); }}
          className="gradient-primary text-primary-foreground shadow-glow-primary hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Viagem
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar viagens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="ativas" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Ativas ({viagensAtivas.length})
          </TabsTrigger>
          <TabsTrigger value="arquivadas" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            Arquivadas ({viagensArquivadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativas" className="mt-5">
          {isLoading ? <SkeletonCards /> : filteredViagensAtivas.length === 0 ? (
            <EmptyState text="Nenhuma viagem ativa encontrada" />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredViagensAtivas.map((viagem, index) => (
                <ViagemCard key={viagem.id} viagem={viagem} onEdit={handleEdit} onDelete={handleDelete} onArquivar={handleArquivar} index={index} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="arquivadas" className="mt-5">
          {isLoading ? <SkeletonCards /> : filteredViagensArquivadas.length === 0 ? (
            <EmptyState text="Nenhuma viagem arquivada" />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredViagensArquivadas.map((viagem, index) => (
                <ViagemCard key={viagem.id} viagem={viagem} onEdit={handleEdit} onDelete={handleDelete} onArquivar={handleArquivar} index={index} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ViagemForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingViagem(null); }}
        onSubmit={handleSubmit}
        viagem={editingViagem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
