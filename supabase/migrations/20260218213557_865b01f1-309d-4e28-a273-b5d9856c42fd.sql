-- Adicionar campos de assinatura eletrônica na tabela formularios_contrato
ALTER TABLE public.formularios_contrato 
  ADD COLUMN IF NOT EXISTS assinatura_nome text,
  ADD COLUMN IF NOT EXISTS assinatura_cpf text,
  ADD COLUMN IF NOT EXISTS assinatura_data timestamp with time zone,
  ADD COLUMN IF NOT EXISTS assinatura_ip text,
  ADD COLUMN IF NOT EXISTS link_assinatura uuid DEFAULT gen_random_uuid();

-- Criar índice para busca por link de assinatura
CREATE UNIQUE INDEX IF NOT EXISTS idx_formularios_contrato_link_assinatura 
  ON public.formularios_contrato(link_assinatura);