DROP POLICY IF EXISTS "Staff read productos" ON public.productos;

CREATE POLICY "Staff read productos" ON public.productos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'));
