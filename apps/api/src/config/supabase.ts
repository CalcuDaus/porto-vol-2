import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

export const isSupabaseConfigured = Boolean(
  env.SUPABASE_URL && 
  env.SUPABASE_ANON_KEY && 
  !env.SUPABASE_URL.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  : null;

if (!isSupabaseConfigured) {
  console.log('[Supabase] Running with mock fallback data. Configure SUPABASE_URL and SUPABASE_ANON_KEY in .env to connect to live Supabase.');
} else {
  console.log(`[Supabase] Connected to ${env.SUPABASE_URL}`);
}

