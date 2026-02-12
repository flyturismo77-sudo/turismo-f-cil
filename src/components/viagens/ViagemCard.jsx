import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, DollarSign, Edit, Trash2, Archive, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import placeholder1 from "@/assets/placeholder-travel-1.jpg";
import placeholder2 from "@/assets/placeholder-travel-2.jpg";
import placeholder3 from "@/assets/placeholder-travel-3.jpg";

const placeholders = [placeholder1, placeholder2, placeholder3];

const getPlaceholder = (id) => {
  if (!id) return placeholders[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return placeholders[Math.abs(hash) % placeholders.length];
};

const statusConfig = {
  "Planejamento": { bg: "bg-secondary", text: "text-secondary-foreground", dot: "bg-muted-foreground" },
  "Aberta": { bg: "bg-success/15", text: "text-success", dot: "bg-success" },
  "Em Andamento": { bg: "bg-primary/15", text: "text-primary", dot: "bg-primary" },
  "Finalizada": { bg: "bg-chart-4/15", text: "text-chart-4", dot: "bg-chart-4" },
  "Cancelada": { bg: "bg-destructive/15", text: "text-destructive", dot: "bg-destructive" },
};

export default function ViagemCard({ viagem, onEdit, onDelete, onArquivar, index }) {
  if (!viagem) return null;

  const formatarData = (data) => {
    try {
      return format(new Date(data), "dd/MM/yy");
    } catch {
      return "-";
    }
  };

  const vagasOcupadas = viagem.vagas_ocupadas || 0;
  const vagasTotais = viagem.vagas_totais || 46;
  const valor1 = viagem.valor_1 || 0;
  const valor2 = viagem.valor_2 || 0;
  const valor3 = viagem.valor_3 || 0;
  const percentOcupado = Math.round((vagasOcupadas / vagasTotais) * 100);
  const status = statusConfig[viagem.status] || statusConfig["Planejamento"];

  const imageSrc = (viagem.imagens_urls && Array.isArray(viagem.imagens_urls) && viagem.imagens_urls.length > 0)
    ? viagem.imagens_urls[0]
    : (viagem.imagem_url || getPlaceholder(viagem.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Card className="group overflow-hidden border-border hover:shadow-elevated transition-all duration-300 bg-card">
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img 
            src={imageSrc} 
            alt={viagem.destino || "Destino"} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = getPlaceholder(viagem.id);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <Badge className={`${status.bg} ${status.text} border-0 font-medium text-xs px-2.5 py-1 backdrop-blur-sm`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5 inline-block`} />
              {viagem.status || "Planejamento"}
            </Badge>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-3 left-4 right-4">
            <Link to={`${createPageUrl('DetalhesViagem')}?id=${viagem.id}`}>
              <h3 className="text-lg font-display font-bold text-white drop-shadow-md hover:underline cursor-pointer flex items-center gap-1.5 leading-tight">
                {viagem.nome || "Sem nome"}
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </h3>
            </Link>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-sm truncate">{viagem.destino || "Destino não definido"}</span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Saída</p>
                <p className="text-sm font-semibold text-foreground">
                  {viagem.data_saida ? formatarData(viagem.data_saida) : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-accent" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Retorno</p>
                <p className="text-sm font-semibold text-foreground">
                  {viagem.data_retorno ? formatarData(viagem.data_retorno) : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Vagas */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Vagas</span>
              </div>
              <span className="text-sm font-bold text-foreground">{vagasOcupadas}/{vagasTotais}</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full gradient-primary transition-all duration-500"
                style={{ width: `${Math.min(percentOcupado, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Valores */}
          <div className="p-3 bg-success/5 rounded-lg border border-success/15">
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-medium text-success">Valores (3 Lotes)</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              {[
                { label: "1º", value: valor1 },
                { label: "2º", value: valor2 },
                { label: "3º", value: valor3 },
              ].map((lote) => (
                <div key={lote.label}>
                  <p className="text-[10px] text-muted-foreground">{lote.label}</p>
                  <p className="text-sm font-bold text-foreground">
                    R$ {lote.value.toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-border"
              onClick={() => onEdit(viagem)}
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-warning hover:text-warning hover:bg-warning/10 border-border"
              onClick={() => onArquivar(viagem)}
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-border"
              onClick={() => onDelete(viagem)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
