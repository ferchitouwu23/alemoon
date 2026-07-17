DROP POLICY IF EXISTS "Dueno manages categorias" ON public.categorias;

CREATE POLICY "Staff manage categorias" ON public.categorias
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'))
  WITH CHECK (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'));
