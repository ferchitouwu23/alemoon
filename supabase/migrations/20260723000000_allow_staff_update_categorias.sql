DROP POLICY IF EXISTS "Staff update categorias" ON public.categorias;

CREATE POLICY "Staff update categorias" ON public.categorias
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'))
  WITH CHECK (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'));
