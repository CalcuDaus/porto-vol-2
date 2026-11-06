import type { Plugin, ViteDevServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

export interface WebpPluginOptions {
  staticDir?: string;
  quality?: number;
  effort?: number;
}

let sharpModule: any = null;
let sharpChecked = false;

async function getSharp() {
  if (sharpChecked) return sharpModule;
  sharpChecked = true;
  try {
    // Dynamic import to prevent crash when sharp is not installed (e.g., CI/Vercel)
    const mod = await import('sharp');
    sharpModule = mod.default || mod;
    return sharpModule;
  } catch {
    sharpModule = null;
    return null;
  }
}

export function autoWebpPlugin(options: WebpPluginOptions = {}): Plugin {
  const quality = options.quality ?? 85;
  const effort = options.effort ?? 6;

  async function processFile(filePath: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

    const webpPath = path.join(path.dirname(filePath), `${path.basename(filePath, ext)}.webp`);

    try {
      if (fs.existsSync(webpPath)) {
        const srcStat = fs.statSync(filePath);
        const webpStat = fs.statSync(webpPath);
        // If webp is newer than source, skip
        if (webpStat.mtimeMs >= srcStat.mtimeMs) return;
      }

      const sharpInstance = await getSharp();
      if (!sharpInstance) {
        return;
      }

      const inStat = fs.statSync(filePath);
      await sharpInstance(filePath)
        .webp({ quality, effort, alphaQuality: 90 })
        .toFile(webpPath);
      const outStat = fs.statSync(webpPath);
      const saving = ((1 - outStat.size / inStat.size) * 100).toFixed(1);
      console.log(`[auto-webp] Converted ${path.basename(filePath)} (${(inStat.size / 1024).toFixed(1)} KB) -> ${path.basename(webpPath)} (${(outStat.size / 1024).toFixed(1)} KB) [ -${saving}% ]`);
    } catch (err) {
      console.error(`[auto-webp] Failed to convert ${filePath}:`, err);
    }
  }

  async function scanDirectory(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else {
        await processFile(fullPath);
      }
    }
  }

  return {
    name: 'vite-plugin-auto-webp',
    async buildStart() {
      // In production or on Vercel, pre-converted webp images are already committed
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        return;
      }
      const sharpInstance = await getSharp();
      if (!sharpInstance) return;

      const staticDir = options.staticDir || path.resolve(process.cwd(), 'static');
      await scanDirectory(staticDir);
    },
    configureServer(server: ViteDevServer) {
      const staticDir = options.staticDir || path.resolve(process.cwd(), 'static');
      scanDirectory(staticDir);

      server.watcher.on('add', (filePath: string) => {
        if (filePath.startsWith(staticDir)) {
          processFile(filePath);
        }
      });
      server.watcher.on('change', (filePath: string) => {
        if (filePath.startsWith(staticDir)) {
          processFile(filePath);
        }
      });
    }
  };
}

export default autoWebpPlugin;
