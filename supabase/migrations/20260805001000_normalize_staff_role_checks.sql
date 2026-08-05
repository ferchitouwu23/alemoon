ALTER TABLE public.perfiles
ADD COLUMN IF NOT EXISTS rol TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
  ) THEN
    UPDATE public.perfiles AS perfiles
    SET rol = CASE user_roles.role::text
      WHEN 'dueno' THEN U&'due\00F1o'
      WHEN 'gestora' THEN 'gestora'
      ELSE perfiles.rol
    END
    FROM public.user_roles AS user_roles
    WHERE perfiles.id = user_roles.user_id
      AND (perfiles.rol IS NULL OR perfiles.rol = '');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE id = _user_id
      AND (
        (_role::text = 'dueno' AND rol IN (U&'due\00F1o', 'dueno'))
        OR (_role::text = 'gestora' AND rol = 'gestora')
      )
  );
$$;
