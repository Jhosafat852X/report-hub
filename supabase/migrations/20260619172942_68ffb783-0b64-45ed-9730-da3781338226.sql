
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('encargado', 'mantenimiento', 'admin');
CREATE TYPE public.urgencia_nivel AS ENUM ('baja', 'media', 'alta');
CREATE TYPE public.reporte_estado AS ENUM ('pendiente', 'programado', 'finalizado');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL DEFAULT '',
  area TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- reportes
CREATE TABLE public.reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asunto TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  urgencia public.urgencia_nivel NOT NULL DEFAULT 'media',
  foto_url TEXT,
  estado public.reporte_estado NOT NULL DEFAULT 'pendiente',
  area TEXT,
  creado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creado_por_nombre TEXT NOT NULL DEFAULT '',
  fecha_programada DATE,
  atendido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  atendido_por_nombre TEXT,
  fecha_finalizado TIMESTAMPTZ,
  notas_mantenimiento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reportes TO authenticated;
GRANT ALL ON public.reportes TO service_role;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reportes_select_authenticated" ON public.reportes FOR SELECT TO authenticated USING (true);
CREATE POLICY "reportes_insert_self" ON public.reportes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creado_por);
CREATE POLICY "reportes_update_owner_pendiente" ON public.reportes FOR UPDATE TO authenticated
  USING (auth.uid() = creado_por AND estado = 'pendiente')
  WITH CHECK (auth.uid() = creado_por);
CREATE POLICY "reportes_update_mantenimiento" ON public.reportes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'mantenimiento') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'mantenimiento') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "reportes_delete_owner_pendiente" ON public.reportes FOR DELETE TO authenticated
  USING ((auth.uid() = creado_por AND estado = 'pendiente') OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_reportes_estado ON public.reportes(estado);
CREATE INDEX idx_reportes_creado_por ON public.reportes(creado_por);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_reportes_updated_at BEFORE UPDATE ON public.reportes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- handle_new_user trigger -> profile + default role encargado
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'encargado')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage policies for "reportes" bucket
CREATE POLICY "reportes_bucket_read_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'reportes');
CREATE POLICY "reportes_bucket_insert_auth" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reportes');
CREATE POLICY "reportes_bucket_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'reportes' AND owner = auth.uid());
CREATE POLICY "reportes_bucket_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'reportes' AND owner = auth.uid());
