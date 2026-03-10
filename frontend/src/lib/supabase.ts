import { createClient } from '@supabase/supabase-js';

/**
 * Client global de Supabase utilitzat a tota l'app.
 *
 * `detectSessionInUrl: true` és necessari per completar fluxos com:
 * - callback d'autenticació per email
 * - recuperació de contrasenya via enllaç magic
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
