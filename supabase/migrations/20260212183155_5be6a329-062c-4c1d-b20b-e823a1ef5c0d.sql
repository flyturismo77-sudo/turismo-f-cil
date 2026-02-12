
-- Criar tabela de despesas com pessoal
CREATE TABLE public.despesas_pessoal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Salário',
  id_membro_equipe UUID REFERENCES public.equipe(id) ON DELETE SET NULL,
  id_viagem UUID REFERENCES public.viagens(id) ON DELETE SET NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  data_pagamento DATE,
  data_vencimento DATE,
  status TEXT NOT NULL DEFAULT 'Pendente',
  forma_pagamento TEXT DEFAULT 'PIX',
  comprovante_url TEXT,
  observacoes TEXT,
  recorrente BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.despesas_pessoal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage despesas_pessoal"
ON public.despesas_pessoal FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can view despesas_pessoal"
ON public.despesas_pessoal FOR SELECT
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_despesas_pessoal_updated_at
BEFORE UPDATE ON public.despesas_pessoal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo intervalo_dias na tabela parcelas para parcelamento flexível
ALTER TABLE public.parcelas ADD COLUMN IF NOT EXISTS intervalo_dias INTEGER DEFAULT 30;
