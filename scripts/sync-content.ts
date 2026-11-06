import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cwd = process.cwd();
const jsonPath = resolve(cwd, 'apps', 'api', 'data', 'content.json');
const tsPath = resolve(cwd, 'apps', 'web', 'src', 'lib', 'data', 'defaultContent.ts');

console.log('🔄 Reading apps/api/data/content.json...');
const raw = readFileSync(jsonPath, 'utf-8');
const content = JSON.parse(raw);

console.log('📝 Updating apps/web/src/lib/data/defaultContent.ts...');
const tsContent = `import type { SiteContent } from '../types';\n\nexport const defaultContent: SiteContent = ${JSON.stringify(content, null, 2)};\n`;
writeFileSync(tsPath, tsContent, 'utf-8');
console.log('✅ Synchronized content.json to defaultContent.ts!');

// Read Supabase credentials from environment if available
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  try {
    console.log(`☁️ Syncing content to Supabase (${supabaseUrl})...`);
    const res = await fetch(`${supabaseUrl}/rest/v1/site_content?on_conflict=id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: 'main',
        content,
        updated_at: new Date().toISOString()
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('⚠️ Supabase REST API response:', res.status, errText);
    } else {
      console.log('🎉 Successfully synced content to Supabase database!');
    }
  } catch (err) {
    console.warn('⚠️ Supabase sync skipped/failed:', err instanceof Error ? err.message : err);
  }
} else {
  console.log('ℹ️ No SUPABASE_URL in local env. Synced locally to defaultContent.ts.');
}
