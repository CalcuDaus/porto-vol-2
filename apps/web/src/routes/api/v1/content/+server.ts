import { json } from '@sveltejs/kit';
import { defaultContent } from '#lib/data/defaultContent';
import { supabase, isSupabaseConfigured } from '#lib/supabase';

export async function GET() {
  const cacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'CDN-Cache-Control': 'no-store'
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('id', 'main')
        .single();

      if (!error && data?.content) {
        return json(
          {
            success: true,
            data: data.content,
            timestamp: new Date().toISOString()
          },
          { headers: cacheHeaders }
        );
      }
    } catch (e) {
      console.warn('[Vercel Serverless] Supabase fetch error, fallback to defaultContent:', e);
    }
  }

  return json(
    {
      success: true,
      data: defaultContent,
      timestamp: new Date().toISOString()
    },
    { headers: cacheHeaders }
  );
}

