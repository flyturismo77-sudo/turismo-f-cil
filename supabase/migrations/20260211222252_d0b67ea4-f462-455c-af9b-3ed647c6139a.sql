
-- =============================================
-- TABELAS DE DADOS DO NEGÓCIO - FLY TURISMO
-- =============================================

-- 1. VIAGENS
CREATE TABLE public.viagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  destino text NOT NULL,
  data_saida date,
  data_retorno date,
  modelo_onibus text DEFAULT 'LD',
  vagas_totais integer DEFAULT 46,
  vagas_ocupadas integer DEFAULT 0,
  valor_1 numeric(10,2) DEFAULT 0,
  valor_2 numeric(10,2) DEFAULT 0,
  valor_3 numeric(10,2) DEFAULT 0,
  modo_pirapark boolean DEFAULT false,
  status text DEFAULT 'Planejamento',
  imagem_url text,
  imagens_urls text[] DEFAULT '{}',
  arquivada boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view viagens" ON public.viagens
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage viagens" ON public.viagens
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can manage viagens" ON public.viagens
  FOR ALL USING (has_role(auth.uid(), 'employee'::app_role));

CREATE TRIGGER update_viagens_updated_at
  BEFORE UPDATE ON public.viagens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. CLIENTES
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  cpf text,
  sexo text,
  data_nascimento date,
  idade integer,
  telefone text,
  email text,
  rua text,
  numero text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  local_embarque text,
  id_viagem uuid REFERENCES public.viagens(id) ON DELETE SET NULL,
  forma_pagamento text DEFAULT 'À Vista',
  numero_parcelas integer DEFAULT 1,
  valor_selecionado text DEFAULT 'Valor 1',
  valor_personalizado numeric(10,2) DEFAULT 0,
  e_crianca_colo boolean DEFAULT false,
  possui_crianca_colo boolean DEFAULT false,
  nome_crianca_colo text,
  idade_crianca_colo integer DEFAULT 0,
  status_pagamento text DEFAULT 'Pendente',
  valor_total_pacote numeric(10,2) DEFAULT 0,
  valor_pago numeric(10,2) DEFAULT 0,
  cor_grupo text,
  numero_grupo integer DEFAULT 1,
  observacoes text,
  id_cliente_principal uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  poltrona integer,
  andar_onibus text,
  arquivado boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clientes" ON public.clientes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage clientes" ON public.clientes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can manage clientes" ON public.clientes
  FOR ALL USING (has_role(auth.uid(), 'employee'::app_role));

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. PAGAMENTOS
CREATE TABLE public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  valor numeric(10,2) DEFAULT 0,
  data_pagamento date,
  forma_pagamento text DEFAULT 'PIX',
  numero_parcela integer DEFAULT 1,
  comprovante_url text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pagamentos" ON public.pagamentos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage pagamentos" ON public.pagamentos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can manage pagamentos" ON public.pagamentos
  FOR ALL USING (has_role(auth.uid(), 'employee'::app_role));

CREATE TRIGGER update_pagamentos_updated_at
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. PARCELAS
CREATE TABLE public.parcelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  id_viagem uuid REFERENCES public.viagens(id) ON DELETE SET NULL,
  numero_parcela integer NOT NULL,
  total_parcelas integer NOT NULL,
  valor_parcela numeric(10,2) DEFAULT 0,
  data_vencimento date,
  status text DEFAULT 'Pendente',
  forma_pagamento text,
  data_pagamento date,
  comprovante_url text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view parcelas" ON public.parcelas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage parcelas" ON public.parcelas
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can manage parcelas" ON public.parcelas
  FOR ALL USING (has_role(auth.uid(), 'employee'::app_role));

CREATE TRIGGER update_parcelas_updated_at
  BEFORE UPDATE ON public.parcelas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. ASSENTOS
CREATE TABLE public.assentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_poltrona integer NOT NULL,
  id_viagem uuid REFERENCES public.viagens(id) ON DELETE CASCADE,
  andar text DEFAULT 'Primeiro Andar',
  posicao text DEFAULT 'Janela',
  status text DEFAULT 'Disponível',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assentos" ON public.assentos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage assentos" ON public.assentos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can manage assentos" ON public.assentos
  FOR ALL USING (has_role(auth.uid(), 'employee'::app_role));

CREATE TRIGGER update_assentos_updated_at
  BEFORE UPDATE ON public.assentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. QUARTOS
CREATE TABLE public.quartos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_viagem uuid REFERENCES public.viagens(id) ON DELETE CASCADE,
  numero_quarto text NOT NULL,
  capacidade integer DEFAULT 4,
  ocupados integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quartos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view quartos" ON public.quartos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage quartos" ON public.quartos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can manage quartos" ON public.quartos
  FOR ALL USING (has_role(auth.uid(), 'employee'::app_role));

CREATE TRIGGER update_quartos_updated_at
  BEFORE UPDATE ON public.quartos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. DOCUMENTOS DE VIAGEM
CREATE TABLE public.documentos_viagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_viagem uuid REFERENCES public.viagens(id) ON DELETE CASCADE,
  tipo text,
  nome text,
  conteudo text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_viagem ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documentos" ON public.documentos_viagem
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage documentos" ON public.documentos_viagem
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can manage documentos" ON public.documentos_viagem
  FOR ALL USING (has_role(auth.uid(), 'employee'::app_role));

CREATE TRIGGER update_documentos_viagem_updated_at
  BEFORE UPDATE ON public.documentos_viagem
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. EQUIPE
CREATE TABLE public.equipe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cargo text,
  telefone text,
  email text,
  foto_url text,
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view equipe" ON public.equipe
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage equipe" ON public.equipe
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_equipe_updated_at
  BEFORE UPDATE ON public.equipe
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. CONTATOS
CREATE TABLE public.contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  telefone text,
  mensagem text,
  lida boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create contatos" ON public.contatos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view contatos" ON public.contatos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage contatos" ON public.contatos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. PAGAMENTOS DA EMPRESA (DESPESAS)
CREATE TABLE public.pagamentos_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric(10,2) DEFAULT 0,
  data_pagamento date,
  categoria text,
  fornecedor text,
  comprovante_url text,
  observacoes text,
  id_viagem uuid REFERENCES public.viagens(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pagamentos_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pagamentos_empresa" ON public.pagamentos_empresa
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pagamentos_empresa_updated_at
  BEFORE UPDATE ON public.pagamentos_empresa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. FORNECEDORES
CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text,
  contato text,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view fornecedores" ON public.fornecedores
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage fornecedores" ON public.fornecedores
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. FORMULÁRIOS
CREATE TABLE public.formularios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  campos jsonb DEFAULT '[]',
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view formularios" ON public.formularios
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage formularios" ON public.formularios
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_formularios_updated_at
  BEFORE UPDATE ON public.formularios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. MENSAGENS
CREATE TABLE public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id uuid,
  destinatario_id uuid,
  conteudo text,
  lida boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.mensagens
  FOR SELECT USING (auth.uid() = remetente_id OR auth.uid() = destinatario_id);

CREATE POLICY "Authenticated users can send messages" ON public.mensagens
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all messages" ON public.mensagens
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 14. LOGS DE AUDITORIA
CREATE TABLE public.logs_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid,
  acao text NOT NULL,
  entidade text,
  entidade_id uuid,
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs" ON public.logs_auditoria
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create logs" ON public.logs_auditoria
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
