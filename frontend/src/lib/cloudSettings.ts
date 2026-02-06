import { supabase } from './supabase';
import type { AppSettings } from '../utils/settings';
import type { Language } from '../utils/translations';

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
