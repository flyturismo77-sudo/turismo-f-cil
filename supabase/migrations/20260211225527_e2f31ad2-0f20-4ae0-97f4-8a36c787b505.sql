
-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update uploads"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);

-- Add missing columns to equipe table
ALTER TABLE public.equipe ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.equipe ADD COLUMN IF NOT EXISTS id_viagem uuid REFERENCES public.viagens(id);
ALTER TABLE public.equipe ADD COLUMN IF NOT EXISTS funcao text DEFAULT 'Guia';
ALTER TABLE public.equipe ADD COLUMN IF NOT EXISTS status text DEFAULT 'Ativo';
ALTER TABLE public.equipe ADD COLUMN IF NOT EXISTS nome_completo text;

-- Sync nome_completo from nome for existing records
UPDATE public.equipe SET nome_completo = nome WHERE nome_completo IS NULL;

-- Add missing columns to fornecedores table
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS tipo_servico text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS cnpj text;

-- Sync tipo_servico from tipo for existing records  
UPDATE public.fornecedores SET tipo_servico = tipo WHERE tipo_servico IS NULL;

-- Add missing columns to contatos table
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS status text DEFAULT 'Novo';

-- Add missing columns to clientes table (for quartos feature)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS id_quarto uuid REFERENCES public.quartos(id);

-- Add missing columns to quartos table (for bed configuration)
ALTER TABLE public.quartos ADD COLUMN IF NOT EXISTS camas_casal integer DEFAULT 0;
ALTER TABLE public.quartos ADD COLUMN IF NOT EXISTS camas_solteiro integer DEFAULT 0;
ALTER TABLE public.quartos ADD COLUMN IF NOT EXISTS camas_beliche integer DEFAULT 0;
ALTER TABLE public.quartos ADD COLUMN IF NOT EXISTS camas_extra integer DEFAULT 0;
ALTER TABLE public.quartos ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'Duplo';

-- Add missing columns to configuracao_empresa
ALTER TABLE public.configuracao_empresa ADD COLUMN IF NOT EXISTS slogan text;
ALTER TABLE public.configuracao_empresa ADD COLUMN IF NOT EXISTS sobre_nos text;
