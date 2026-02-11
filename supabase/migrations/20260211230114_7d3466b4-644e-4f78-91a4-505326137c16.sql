-- Allow public access to open viagens (for public pages like ViagensPublico and FormularioContrato)
CREATE POLICY "Anyone can view open viagens"
ON public.viagens
FOR SELECT
USING (status = 'Aberta');