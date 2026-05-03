-- Inventario · signup approval gate
-- Tabla para rastrear usuarios y su estado de aprobación.

CREATE TABLE IF NOT EXISTS public.inventario_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  aprobado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventario_users ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo puede leer su propia fila.
CREATE POLICY "users see own inventario_user"
  ON public.inventario_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- La Edge Function usa service role key para insertar, no se necesita INSERT policy para anon/auth.
