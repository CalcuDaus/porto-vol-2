import { json } from '@sveltejs/kit';
import { supabase, isSupabaseConfigured } from '#lib/supabase';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !message) {
      return json({ success: false, error: 'Semua kolom wajib diisi.' }, { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('messages').insert({
        name,
        email,
        message
      });
      if (error) {
        console.warn('[Vercel Serverless] Supabase insert message warning:', error.message);
      }
    }

    return json({
      success: true,
      message: 'Pesan Anda berhasil dikirim!',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return json({ success: false, error: 'Gagal memproses pesan.' }, { status: 500 });
  }
}

