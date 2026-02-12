import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const busModels = [
  { value: 'LD', label: 'Low Driver (LD) 46', capacity: 46 },
  { value: 'LD48', label: 'Low Driver (LD) 48', capacity: 48 },
  { value: 'DD', label: 'Double Deck (DD) 57', capacity: 57 },
  { value: 'DD_DS_TUR', label: 'DD DS TUR 56', capacity: 56 },
  { value: 'VAN', label: 'VAN', capacity: 20 }
];

export default function ViagemForm({ open, onClose, onSubmit, viagem, isLoading }) {
  const [formData, setFormData] = useState({
    nome: '',
    destino: '',
    data_saida: '',
    data_retorno: '',
    modelo_onibus: 'LD',
    vagas_totais: 46,
    vagas_ocupadas: 0,
    valor_1: 0,
    valor_2: 0,
    valor_3: 0,
    modo_pirapark: false,
    status: 'Planejamento',
    imagem_url: '',
    imagens_urls: [],
    arquivada: false
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState('');

  useEffect(() => {
    if (viagem) {
      setFormData({
        nome: viagem.nome || '',
        destino: viagem.destino || '',
        data_saida: viagem.data_saida ? viagem.data_saida.split('T')[0] : '',
        data_retorno: viagem.data_retorno ? viagem.data_retorno.split('T')[0] : '',
        modelo_onibus: viagem.modelo_onibus || 'LD',
        vagas_totais: viagem.vagas_totais || 46,
        vagas_ocupadas: viagem.vagas_ocupadas || 0,
        valor_1: viagem.valor_1 || 0,
        valor_2: viagem.valor_2 || 0,
        valor_3: viagem.valor_3 || 0,
        modo_pirapark: viagem.modo_pirapark || false,
        status: viagem.status || 'Planejamento',
        imagem_url: viagem.imagem_url || '',
        imagens_urls: viagem.imagens_urls || [],
        arquivada: viagem.arquivada || false
      });
    } else {
      setFormData({
        nome: '',
        destino: '',
        data_saida: '',
        data_retorno: '',
        modelo_onibus: 'LD',
        vagas_totais: 46,
        vagas_ocupadas: 0,
        valor_1: 0,
        valor_2: 0,
        valor_3: 0,
        modo_pirapark: false,
        status: 'Planejamento',
        imagem_url: '',
        imagens_urls: [],
        arquivada: false
      });
    }
  }, [viagem, open]);

  const handleModeloChange = (value) => {
    const model = busModels.find(m => m.value === value);
    setFormData({
      ...formData,
      modelo_onibus: value,
      vagas_totais: model ? model.capacity : 46
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (result.file_url) {
        setFormData(prev => ({
          ...prev,
          imagem_url: result.file_url,
          imagens_urls: [...(prev.imagens_urls || []), result.file_url]
        }));
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddManualUrl = () => {
    if (manualImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        imagem_url: prev.imagem_url || manualImageUrl.trim(),
        imagens_urls: [...(prev.imagens_urls || []), manualImageUrl.trim()]
      }));
      setManualImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => {
      const newImages = [...(prev.imagens_urls || [])];
      newImages.splice(index, 1);
      return {
        ...prev,
        imagens_urls: newImages,
        imagem_url: newImages[0] || ''
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {viagem ? '✏️ Editar Viagem' : '➕ Nova Viagem'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Viagem *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Caldas Novas 2025"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Destino *</Label>
              <Input
                value={formData.destino}
                onChange={(e) => setFormData({...formData, destino: e.target.value})}
                placeholder="Ex: Caldas Novas - GO"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Saída *</Label>
              <Input
                type="date"
                value={formData.data_saida}
                onChange={(e) => setFormData({...formData, data_saida: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Retorno *</Label>
              <Input
                type="date"
                value={formData.data_retorno}
                onChange={(e) => setFormData({...formData, data_retorno: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modelo do Ônibus *</Label>
              <Select
                value={formData.modelo_onibus}
                onValueChange={handleModeloChange}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {busModels.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label} - {model.capacity} lugares
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total de Vagas</Label>
              <Input
                type="number"
                value={formData.vagas_totais}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4 text-gray-900">Valores do Pacote (R$)</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>1º Valor (Inicial) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_1}
                  onChange={(e) => setFormData({...formData, valor_1: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>2º Valor (Intermediário) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_2}
                  onChange={(e) => setFormData({...formData, valor_2: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>3º Valor (Final) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_3}
                  onChange={(e) => setFormData({...formData, valor_3: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="modo_pirapark"
              checked={formData.modo_pirapark}
              onChange={(e) => setFormData({...formData, modo_pirapark: e.target.checked})}
              className="w-4 h-4"
            />
            <Label htmlFor="modo_pirapark" className="cursor-pointer">
              Ativar modo PIRAPARK (preços automáticos por faixa etária)
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({...formData, status: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planejamento">Planejamento</SelectItem>
                <SelectItem value="Aberta">Aberta</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Finalizada">Finalizada</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4 text-gray-900">Imagens do Destino</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="flex-1"
                />
                {uploadingImage && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ou cole URL da imagem"
                  value={manualImageUrl}
                  onChange={(e) => setManualImageUrl(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddManualUrl} variant="outline">
                  Adicionar
                </Button>
              </div>

              {formData.imagens_urls && formData.imagens_urls.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {formData.imagens_urls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {viagem ? '💾 Salvar' : 'Criar Viagem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}