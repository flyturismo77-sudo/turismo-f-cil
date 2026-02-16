import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plane, User, DollarSign, Activity } from "lucide-react";

export default function RecentActivity({ viagens, clientes, pagamentos }) {
  const activities = [
    ...viagens.slice(0, 2).map(v => ({
      type: 'viagem',
      icon: Plane,
      color: 'text-sky-500',
      bg: 'bg-sky-50',
      title: `Nova viagem: ${v.nome}`,
      date: v.created_at,
    })),
    ...clientes.slice(0, 2).map(c => ({
      type: 'cliente',
      icon: User,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
      title: `Cliente cadastrado: ${c.nome_completo}`,
      date: c.created_at,
    })),
    ...pagamentos.slice(0, 2).map(p => ({
      type: 'pagamento',
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      title: `Pagamento recebido: R$ ${(p.valor || 0).toFixed(2)}`,
      date: p.created_at,
    })),
  ]
    .filter(a => a.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <Card className="shadow-sm border-slate-200/60 bg-white">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-400" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhuma atividade recente</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-sky-50/50 transition-colors duration-200">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${activity.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 text-sm">{activity.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
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
