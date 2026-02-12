import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plane, User, DollarSign } from "lucide-react";

export default function RecentActivity({ viagens, clientes, pagamentos }) {
  const activities = [
    ...viagens.slice(0, 2).map(v => ({
      type: 'viagem',
      icon: Plane,
      color: 'text-primary',
      bg: 'bg-primary/10',
      title: `Nova viagem: ${v.nome}`,
      date: v.created_at,
    })),
    ...clientes.slice(0, 2).map(c => ({
      type: 'cliente',
      icon: User,
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
      title: `Cliente cadastrado: ${c.nome_completo}`,
      date: c.created_at,
    })),
    ...pagamentos.slice(0, 2).map(p => ({
      type: 'pagamento',
      icon: DollarSign,
      color: 'text-success',
      bg: 'bg-success/10',
      title: `Pagamento recebido: R$ ${(p.valor || 0).toFixed(2)}`,
      date: p.created_at,
    })),
  ]
    .filter(a => a.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <Card className="shadow-elevated border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg font-display font-bold">Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhuma atividade recente</div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-muted/50 transition-colors duration-200">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${activity.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
