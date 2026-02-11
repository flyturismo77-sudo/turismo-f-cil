
-- Create formularios_contrato table for public form submissions
CREATE TABLE public.formularios_contrato (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_viagem uuid REFERENCES public.viagens(id),
  nome_completo text NOT NULL,
  rg text,
  cpf text,
  sexo text,
  rua text,
  numero text,
  bairro text,
  cidade text,
  data_nascimento date,
  email text,
  telefone text,
  forma_pagamento text DEFAULT 'À Vista',
  numero_parcelas integer DEFAULT 1,
  possui_crianca_colo boolean DEFAULT false,
  nome_crianca_colo text,
  idade_crianca_colo integer DEFAULT 0,
  desconto numeric DEFAULT 0,
  passageiros jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'Pendente',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.formularios_contrato ENABLE ROW LEVEL SECURITY;

-- Anyone can submit the form (it's public)
CREATE POLICY "Anyone can create formularios_contrato"
  ON public.formularios_contrato FOR INSERT
  WITH CHECK (true);

-- Authenticated users can view
CREATE POLICY "Authenticated users can view formularios_contrato"
  ON public.formularios_contrato FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage
CREATE POLICY "Admins can manage formularios_contrato"
  ON public.formularios_contrato FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Employees can manage  
CREATE POLICY "Employees can manage formularios_contrato"
  ON public.formularios_contrato FOR ALL
  USING (has_role(auth.uid(), 'employee'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_formularios_contrato_updated_at
  BEFORE UPDATE ON public.formularios_contrato
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
