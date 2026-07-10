
CREATE TYPE public.app_role AS ENUM ('dueno', 'gestora');

CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.perfiles TO authenticated;
GRANT ALL ON public.perfiles TO service_role;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users read own profile" ON public.perfiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.perfiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Dueno reads all profiles" ON public.perfiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'dueno'));

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Dueno manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'dueno'))
  WITH CHECK (public.has_role(auth.uid(), 'dueno'));

CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE
);
GRANT SELECT ON public.categorias TO anon, authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads categorias" ON public.categorias
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Dueno manages categorias" ON public.categorias
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'dueno'))
  WITH CHECK (public.has_role(auth.uid(), 'dueno'));

CREATE TABLE public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_oferta NUMERIC(10,2),
  en_oferta BOOLEAN NOT NULL DEFAULT false,
  imagen_url TEXT NOT NULL DEFAULT '',
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.productos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO authenticated;
GRANT ALL ON public.productos TO service_role;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads visible productos" ON public.productos
  FOR SELECT TO anon USING (visible = true);
CREATE POLICY "Staff read productos" ON public.productos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'));
CREATE POLICY "Staff insert productos" ON public.productos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'));
CREATE POLICY "Staff update productos" ON public.productos
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'))
  WITH CHECK (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora'));
CREATE POLICY "Dueno delete productos" ON public.productos
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'dueno'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_first BOOLEAN;
BEGIN
  INSERT INTO public.perfiles (id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)));
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_first THEN 'dueno'::public.app_role ELSE 'gestora'::public.app_role END);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Public read productos images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'productos');
CREATE POLICY "Staff upload productos images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'productos' AND (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora')));
CREATE POLICY "Staff update productos images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'productos' AND (public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'gestora')));
CREATE POLICY "Dueno delete productos images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'productos' AND public.has_role(auth.uid(), 'dueno'));
