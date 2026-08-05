CREATE TABLE IF NOT EXISTS public.promociones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imagen_url TEXT NOT NULL,
  titulo TEXT,
  orden INTEGER NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promociones TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promociones TO authenticated;
GRANT ALL ON public.promociones TO service_role;

ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active promociones" ON public.promociones;
CREATE POLICY "Public read active promociones" ON public.promociones
  FOR SELECT TO anon, authenticated
  USING (activo = true);

DROP POLICY IF EXISTS "Staff insert promociones" ON public.promociones;
CREATE POLICY "Staff insert promociones" ON public.promociones
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'));

DROP POLICY IF EXISTS "Staff update promociones" ON public.promociones;
CREATE POLICY "Staff update promociones" ON public.promociones
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'))
  WITH CHECK (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'));

DROP POLICY IF EXISTS "Staff delete promociones" ON public.promociones;
CREATE POLICY "Staff delete promociones" ON public.promociones
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'));
