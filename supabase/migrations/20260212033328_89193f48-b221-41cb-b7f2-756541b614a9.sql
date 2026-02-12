
-- Temporariamente permitir SELECT público em todas as tabelas principais (fase de migração)
-- Clientes
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;
CREATE POLICY "Anyone can view clientes" ON public.clientes FOR SELECT USING (true);

-- Viagens
DROP POLICY IF EXISTS "Authenticated users can view viagens" ON public.viagens;
CREATE POLICY "Anyone can view all viagens" ON public.viagens FOR SELECT USING (true);

-- Pagamentos
DROP POLICY IF EXISTS "Authenticated users can view pagamentos" ON public.pagamentos;
CREATE POLICY "Anyone can view pagamentos" ON public.pagamentos FOR SELECT USING (true);

-- Parcelas
DROP POLICY IF EXISTS "Authenticated users can view parcelas" ON public.parcelas;
CREATE POLICY "Anyone can view parcelas" ON public.parcelas FOR SELECT USING (true);

-- Assentos
DROP POLICY IF EXISTS "Authenticated users can view assentos" ON public.assentos;
CREATE POLICY "Anyone can view assentos" ON public.assentos FOR SELECT USING (true);

-- Quartos
DROP POLICY IF EXISTS "Authenticated users can view quartos" ON public.quartos;
CREATE POLICY "Anyone can view quartos" ON public.quartos FOR SELECT USING (true);

-- Documentos
DROP POLICY IF EXISTS "Authenticated users can view documentos" ON public.documentos_viagem;
CREATE POLICY "Anyone can view documentos" ON public.documentos_viagem FOR SELECT USING (true);

-- Equipe
DROP POLICY IF EXISTS "Authenticated users can view equipe" ON public.equipe;
CREATE POLICY "Anyone can view equipe" ON public.equipe FOR SELECT USING (true);

-- Contatos
DROP POLICY IF EXISTS "Authenticated users can view contatos" ON public.contatos;
CREATE POLICY "Anyone can view contatos" ON public.contatos FOR SELECT USING (true);

-- Fornecedores
DROP POLICY IF EXISTS "Authenticated users can view fornecedores" ON public.fornecedores;
CREATE POLICY "Anyone can view fornecedores" ON public.fornecedores FOR SELECT USING (true);

-- Formularios
DROP POLICY IF EXISTS "Authenticated users can view formularios" ON public.formularios;
CREATE POLICY "Anyone can view formularios" ON public.formularios FOR SELECT USING (true);

-- Formularios Contrato
DROP POLICY IF EXISTS "Authenticated users can view formularios_contrato" ON public.formularios_contrato;
CREATE POLICY "Anyone can view formularios_contrato" ON public.formularios_contrato FOR SELECT USING (true);

-- Pagamentos Empresa
CREATE POLICY "Anyone can view pagamentos_empresa" ON public.pagamentos_empresa FOR SELECT USING (true);

-- Logs
DROP POLICY IF EXISTS "Admins can view logs" ON public.logs_auditoria;
CREATE POLICY "Anyone can view logs" ON public.logs_auditoria FOR SELECT USING (true);

-- Permitir INSERT/UPDATE/DELETE público também (para funcionar sem login)
-- Clientes
DROP POLICY IF EXISTS "Admins can manage clientes" ON public.clientes;
DROP POLICY IF EXISTS "Employees can manage clientes" ON public.clientes;
CREATE POLICY "Anyone can manage clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

-- Viagens
DROP POLICY IF EXISTS "Admins can manage viagens" ON public.viagens;
DROP POLICY IF EXISTS "Employees can manage viagens" ON public.viagens;
CREATE POLICY "Anyone can manage viagens" ON public.viagens FOR ALL USING (true) WITH CHECK (true);

-- Pagamentos
DROP POLICY IF EXISTS "Admins can manage pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Employees can manage pagamentos" ON public.pagamentos;
CREATE POLICY "Anyone can manage pagamentos" ON public.pagamentos FOR ALL USING (true) WITH CHECK (true);

-- Parcelas
DROP POLICY IF EXISTS "Admins can manage parcelas" ON public.parcelas;
DROP POLICY IF EXISTS "Employees can manage parcelas" ON public.parcelas;
CREATE POLICY "Anyone can manage parcelas" ON public.parcelas FOR ALL USING (true) WITH CHECK (true);

-- Assentos
DROP POLICY IF EXISTS "Admins can manage assentos" ON public.assentos;
DROP POLICY IF EXISTS "Employees can manage assentos" ON public.assentos;
CREATE POLICY "Anyone can manage assentos" ON public.assentos FOR ALL USING (true) WITH CHECK (true);

-- Quartos
DROP POLICY IF EXISTS "Admins can manage quartos" ON public.quartos;
DROP POLICY IF EXISTS "Employees can manage quartos" ON public.quartos;
CREATE POLICY "Anyone can manage quartos" ON public.quartos FOR ALL USING (true) WITH CHECK (true);

-- Documentos
DROP POLICY IF EXISTS "Admins can manage documentos" ON public.documentos_viagem;
DROP POLICY IF EXISTS "Employees can manage documentos" ON public.documentos_viagem;
CREATE POLICY "Anyone can manage documentos" ON public.documentos_viagem FOR ALL USING (true) WITH CHECK (true);

-- Equipe
DROP POLICY IF EXISTS "Admins can manage equipe" ON public.equipe;
CREATE POLICY "Anyone can manage equipe" ON public.equipe FOR ALL USING (true) WITH CHECK (true);

-- Contatos
DROP POLICY IF EXISTS "Admins can manage contatos" ON public.contatos;
CREATE POLICY "Anyone can manage contatos" ON public.contatos FOR ALL USING (true) WITH CHECK (true);

-- Fornecedores
DROP POLICY IF EXISTS "Admins can manage fornecedores" ON public.fornecedores;
CREATE POLICY "Anyone can manage fornecedores" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);

-- Formularios
DROP POLICY IF EXISTS "Admins can manage formularios" ON public.formularios;
CREATE POLICY "Anyone can manage formularios" ON public.formularios FOR ALL USING (true) WITH CHECK (true);

-- Formularios Contrato
DROP POLICY IF EXISTS "Admins can manage formularios_contrato" ON public.formularios_contrato;
DROP POLICY IF EXISTS "Employees can manage formularios_contrato" ON public.formularios_contrato;
CREATE POLICY "Anyone can manage formularios_contrato" ON public.formularios_contrato FOR ALL USING (true) WITH CHECK (true);

-- Pagamentos Empresa
DROP POLICY IF EXISTS "Admins can manage pagamentos_empresa" ON public.pagamentos_empresa;
CREATE POLICY "Anyone can manage pagamentos_empresa" ON public.pagamentos_empresa FOR ALL USING (true) WITH CHECK (true);

-- Config
DROP POLICY IF EXISTS "Admins can manage config" ON public.configuracao_empresa;
CREATE POLICY "Anyone can manage config" ON public.configuracao_empresa FOR ALL USING (true) WITH CHECK (true);

-- Mensagens
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.mensagens;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.mensagens;
DROP POLICY IF EXISTS "Users can view own messages" ON public.mensagens;
CREATE POLICY "Anyone can manage mensagens" ON public.mensagens FOR ALL USING (true) WITH CHECK (true);

-- Logs
DROP POLICY IF EXISTS "System can create logs" ON public.logs_auditoria;
CREATE POLICY "Anyone can manage logs" ON public.logs_auditoria FOR ALL USING (true) WITH CHECK (true);
