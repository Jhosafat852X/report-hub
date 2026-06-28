
-- Seed demo accounts for the three roles
DO $$
DECLARE
  acc RECORD;
  uid uuid;
BEGIN
  FOR acc IN
    SELECT * FROM (VALUES
      ('admin01@unistmo.local', 'admin01', 'Administrador Demo', 'Coordinacion administrativa', 'admin'::public.app_role),
      ('mant01@unistmo.local',  'mant01',  'Mantenimiento Demo', 'Mantenimiento',              'mantenimiento'::public.app_role),
      ('enc01@unistmo.local',   'enc01',   'Encargado Demo',     'Laboratorio de computo 2',   'encargado'::public.app_role)
    ) AS t(email, matricula, nombre, area, rol)
  LOOP
    SELECT id INTO uid FROM auth.users WHERE email = acc.email;

    IF uid IS NULL THEN
      uid := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token,
        email_change_token_new, email_change
      ) VALUES (
        uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated',
        acc.email,
        crypt('Demo123456', gen_salt('bf')),
        now(),
        jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
        jsonb_build_object('nombre_completo', acc.nombre, 'area', acc.area, 'matricula', acc.matricula),
        now(), now(), '', '', '', ''
      );
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), uid,
              jsonb_build_object('sub', uid::text, 'email', acc.email),
              'email', uid::text, now(), now(), now());
    ELSE
      UPDATE auth.users
         SET encrypted_password = crypt('Demo123456', gen_salt('bf')),
             email_confirmed_at = COALESCE(email_confirmed_at, now()),
             raw_user_meta_data = jsonb_build_object('nombre_completo', acc.nombre, 'area', acc.area, 'matricula', acc.matricula),
             updated_at = now()
       WHERE id = uid;
    END IF;

    INSERT INTO public.profiles (id, nombre_completo, email, area)
    VALUES (uid, acc.nombre, acc.email, acc.area)
    ON CONFLICT (id) DO UPDATE
      SET nombre_completo = EXCLUDED.nombre_completo,
          email = EXCLUDED.email,
          area = EXCLUDED.area;

    DELETE FROM public.user_roles WHERE user_id = uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, acc.rol);
  END LOOP;
END $$;
