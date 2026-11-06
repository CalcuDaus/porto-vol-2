import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const cwd = process.cwd();
const webVercelOutput = resolve(cwd, 'apps', 'web', '.vercel', 'output');
const rootVercelOutput = resolve(cwd, '.vercel', 'output');
const rootDist = resolve(cwd, 'dist');

if (existsSync(webVercelOutput)) {
  console.log('📦 Syncing apps/web/.vercel/output to root .vercel/output for Vercel deployment...');
  mkdirSync(resolve(cwd, '.vercel'), { recursive: true });
  cpSync(webVercelOutput, rootVercelOutput, { recursive: true });
  console.log('✅ Root .vercel/output is ready for Vercel deployment!');

  // Fallback for static presets expecting dist directory
  const webStaticOutput = resolve(webVercelOutput, 'static');
  if (existsSync(webStaticOutput)) {
    mkdirSync(rootDist, { recursive: true });
    cpSync(webStaticOutput, rootDist, { recursive: true });
    console.log('✅ Root dist folder synced as static fallback!');
  }
}
