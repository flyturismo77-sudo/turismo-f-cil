import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Archive } from "lucide-react";
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
        // Criar a viagem
        const viagem = await base44.entities.Viagem.create(data);
        
        if (!viagem || !viagem.id) {
          throw new Error("Falha ao criar viagem");
        }
        
        // Criar assentos automaticamente baseado no modelo
        const totalAssentos = data.vagas_totais || 46;
        const modelo = data.modelo_onibus || 'LD';
        
        const assentos = [];
        
        if (modelo === 'VAN') {
          for (let i = 1; i <= totalAssentos; i++) {
            assentos.push({
              numero_poltrona: i,
              id_viagem: viagem.id,
              andar: 'Primeiro Andar',
              posicao: i % 2 === 1 ? 'Janela' : 'Corredor',
              status: 'Disponível'
            });
          }
        } else if (modelo === 'VA_TUR') {
          // VA TUR 57: piso superior 1-48, piso inferior 49-57
          for (let i = 1; i <= totalAssentos; i++) {
            const andar = i <= 48 ? 'Piso Superior' : 'Piso Inferior';
            assentos.push({
              numero_poltrona: i,
              id_viagem: viagem.id,
              andar,
              posicao: i % 2 === 1 ? 'Janela' : 'Corredor',
              status: 'Disponível'
            });
          }
        } else if (modelo === 'DD_DS_TUR') {
          // DD DS TUR 56: piso superior 1-44, piso inferior 45-56
          for (let i = 1; i <= totalAssentos; i++) {
            const andar = i <= 44 ? 'Piso Superior' : 'Piso Inferior';
            assentos.push({
              numero_poltrona: i,
              id_viagem: viagem.id,
              andar,
              posicao: i % 2 === 1 ? 'Janela' : 'Corredor',
              status: 'Disponível'
            });
          }
        } else if (modelo === 'JG_TURISMO_44') {
          // JG Turismo 44: todos no primeiro andar
          for (let i = 1; i <= totalAssentos; i++) {
            assentos.push({
              numero_poltrona: i,
              id_viagem: viagem.id,
              andar: 'Primeiro Andar',
              posicao: i % 2 === 1 ? 'Janela' : 'Corredor',
              status: 'Disponível'
            });
          }
        } else {
          // LD (46 ou 48): todos no primeiro andar
          for (let i = 1; i <= totalAssentos; i++) {
            assentos.push({
              numero_poltrona: i,
              id_viagem: viagem.id,
              andar: 'Primeiro Andar',
              posicao: i % 2 === 1 ? 'Janela' : 'Corredor',
              status: 'Disponível'
            });
          }
        }
        
        // Criar assentos em lote
        if (assentos.length > 0) {
          try {
            await base44.entities.Assento.bulkCreate(assentos);
          } catch (err) {
            console.error("Erro ao criar assentos:", err);
          }
        }
        
        // Criar 26 quartos automaticamente
        const quartos = [];
        for (let i = 1; i <= 26; i++) {
          quartos.push({
            id_viagem: viagem.id,
            numero_quarto: i.toString(),
            capacidade: 4,
            ocupados: 0
          });
        }
        
        // Criar quartos em lote
        if (quartos.length > 0) {
          try {
            await base44.entities.Quarto.bulkCreate(quartos);
          } catch (err) {
            console.error("Erro ao criar quartos:", err);
          }
        }
        
        return viagem;
      } catch (error) {
        console.error("Erro na criação da viagem:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['viagens']);
      setShowForm(false);
      setEditingViagem(null);
    },
    onError: (error) => {
      console.error("Erro ao criar viagem:", error);
      alert("Erro ao criar viagem. Tente novamente.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Viagem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['viagens']);
      setShowForm(false);
      setEditingViagem(null);
    },
    onError: (error) => {
      console.error("Erro ao atualizar viagem:", error);
      alert("Erro ao atualizar viagem. Tente novamente.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Viagem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['viagens']);
    },
    onError: (error) => {
      console.error("Erro ao deletar viagem:", error);
      alert("Erro ao deletar viagem. Tente novamente.");
    }
  });

  const arquivarMutation = useMutation({
    mutationFn: ({ id, arquivada }) => {
      const viagem = viagens.find(v => v.id === id);
      if (!viagem) throw new Error("Viagem não encontrada");
      return base44.entities.Viagem.update(id, { arquivada });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['viagens']);
    },
    onError: (error) => {
      console.error("Erro ao arquivar viagem:", error);
      alert("Erro ao arquivar viagem. Tente novamente.");
    }
  });

  const handleSubmit = (data) => {
    if (editingViagem) {
      updateMutation.mutate({ id: editingViagem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (viagem) => {
    setEditingViagem(viagem);
    setShowForm(true);
  };

  const handleDelete = (viagem) => {
    if (confirm(`Tem certeza que deseja excluir a viagem "${viagem.nome}"?`)) {
      deleteMutation.mutate(viagem.id);
    }
  };

  const handleArquivar = (viagem) => {
    const acao = viagem.arquivada ? 'restaurar' : 'arquivar';
    if (confirm(`Tem certeza que deseja ${acao} a viagem "${viagem.nome}"?`)) {
      arquivarMutation.mutate({ id: viagem.id, arquivada: !viagem.arquivada });
    }
  };

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Erro ao carregar viagens. Tente recarregar a página.</p>
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

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Viagens</h1>
          <p className="text-gray-500 mt-1">Gerencie todas as viagens da Fly Turismo</p>
        </div>
        <Button
          onClick={() => {
            setEditingViagem(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Viagem
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar viagens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ativas">
            Ativas ({viagensAtivas.length})
          </TabsTrigger>
          <TabsTrigger value="arquivadas">
            <Archive className="w-4 h-4 mr-2" />
            Arquivadas ({viagensArquivadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativas" className="mt-6">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-100 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredViagensAtivas.map((viagem, index) => (
                <ViagemCard
                  key={viagem.id}
                  viagem={viagem}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onArquivar={handleArquivar}
                  index={index}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredViagensAtivas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma viagem ativa encontrada</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="arquivadas" className="mt-6">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-100 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredViagensArquivadas.map((viagem, index) => (
                <ViagemCard
                  key={viagem.id}
                  viagem={viagem}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onArquivar={handleArquivar}
                  index={index}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredViagensArquivadas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma viagem arquivada encontrada</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ViagemForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingViagem(null);
        }}
        onSubmit={handleSubmit}
        viagem={editingViagem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}