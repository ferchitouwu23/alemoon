DROP POLICY IF EXISTS "Dueno delete productos" ON public.productos;

CREATE POLICY "Staff delete productos" ON public.productos
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'));
