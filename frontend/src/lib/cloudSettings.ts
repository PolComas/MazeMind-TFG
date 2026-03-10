import { supabase } from './supabase';
import type { AppSettings } from '../utils/settings';
import type { Language } from '../utils/translations';

/**
 * Llegeix la configuracio persistida d'un usuari autenticat.
 *
 * Retorna dades `null` si encara no existeix fila o si Supabase dona error.
 * En aquests casos, el client pot continuar amb la configuracio local.
 */
export async function fetchCloudSettings(
  userId: string
): Promise<{ settings: AppSettings | null; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('fetchCloudSettings error', error);
    return { settings: null, updatedAt: null };
  }

  return {
    settings: (data?.settings ?? null) as AppSettings | null,
    updatedAt: data?.updated_at ?? null,
  };
}

/**
 * Fa `upsert` de tota la configuracio a `user_settings`.
 *
 * L'operacio es idempotent per `user_id` i desa `updated_at` per poder
 * resoldre conflictes de "font de veritat" entre local i cloud.
 */
export async function upsertCloudSettings(userId: string, settings: AppSettings): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, settings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) {
    throw error;
  }
}

/**
 * Carrega la preferencia d'idioma des del cloud.
 *
 * Si el valor es invalid o no existeix, retorna `null` per mantenir
 * l'idioma local/per defecte.
 */
export async function fetchCloudLanguage(userId: string): Promise<Language | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('language')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('fetchCloudLanguage error', error);
    return null;
  }

  const lang = data?.language;
  if (lang === 'ca' || lang === 'es' || lang === 'en') {
    return lang;
  }
  return null;
}

/**
 * Persisteix l'idioma a `user_settings` per sincronitzar entre dispositius.
 */
export async function upsertCloudLanguage(userId: string, language: Language): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, language, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) {
    throw error;
  }
}
