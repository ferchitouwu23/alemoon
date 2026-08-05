CREATE TABLE IF NOT EXISTS public.combos_destacados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imagen_url TEXT NOT NULL,
  etiqueta TEXT,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  mensaje_whatsapp TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.combos_destacados TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.combos_destacados TO authenticated;
GRANT ALL ON public.combos_destacados TO service_role;

ALTER TABLE public.combos_destacados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active combos destacados" ON public.combos_destacados;
CREATE POLICY "Public read active combos destacados" ON public.combos_destacados
  FOR SELECT TO anon, authenticated
  USING (activo = true);

DROP POLICY IF EXISTS "Staff insert combos destacados" ON public.combos_destacados;
CREATE POLICY "Staff insert combos destacados" ON public.combos_destacados
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.perfiles
      WHERE perfiles.id = auth.uid()
        AND perfiles.rol IN ('dueño', 'gestora')
    )
  );

DROP POLICY IF EXISTS "Staff update combos destacados" ON public.combos_destacados;
CREATE POLICY "Staff update combos destacados" ON public.combos_destacados
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.perfiles
      WHERE perfiles.id = auth.uid()
        AND perfiles.rol IN ('dueño', 'gestora')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.perfiles
      WHERE perfiles.id = auth.uid()
        AND perfiles.rol IN ('dueño', 'gestora')
    )
  );

DROP POLICY IF EXISTS "Staff delete combos destacados" ON public.combos_destacados;
CREATE POLICY "Staff delete combos destacados" ON public.combos_destacados
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.perfiles
      WHERE perfiles.id = auth.uid()
        AND perfiles.rol IN ('dueño', 'gestora')
    )
  );
