
-- Adicionar colunas faltantes na tabela formularios_contrato
ALTER TABLE public.formularios_contrato 
ADD COLUMN IF NOT EXISTS estado_civil text,
ADD COLUMN IF NOT EXISTS valor_total numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS dia_vencimento integer DEFAULT 10;
