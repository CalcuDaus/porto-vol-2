import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

interface ConvertOptions {
  quality?: number;
  lossless?: boolean;
  effort?: number;
}

export async function convertFileToWebp(
  inputPath: string,
  outputPath?: string,
  options: ConvertOptions = {}
): Promise<{ inputSize: number; outputSize: number; outputPath: string }> {
  const ext = path.extname(inputPath).toLowerCase();
  const targetPath = outputPath || path.join(path.dirname(inputPath), `${path.basename(inputPath, ext)}.webp`);

  const inStat = fs.statSync(inputPath);
  
  // High quality conversion preserving transparency
  await sharp(inputPath)
    .webp({
      quality: options.quality ?? 85,
      effort: options.effort ?? 6,
      lossless: options.lossless ?? false,
      alphaQuality: 90
    })
    .toFile(targetPath);

  const outStat = fs.statSync(targetPath);
  return {
    inputSize: inStat.size,
    outputSize: outStat.size,
    outputPath: targetPath
  };
}

export async function convertDirectoryImages(
  dirPath: string,
  options: ConvertOptions = {}
): Promise<Array<{ file: string; inKb: string; outKb: string; saving: string }>> {
  if (!fs.existsSync(dirPath)) return [];
  
  const results = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subResults = await convertDirectoryImages(fullPath, options);
      results.push(...subResults);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;

    // Skip if it's already a webp or special file
    try {
      const res = await convertFileToWebp(fullPath, undefined, options);
      const inKb = (res.inputSize / 1024).toFixed(1);
      const outKb = (res.outputSize / 1024).toFixed(1);
      const saving = ((1 - res.outputSize / res.inputSize) * 100).toFixed(1);

      results.push({
        file: path.relative(process.cwd(), fullPath),
        inKb,
        outKb,
        saving
      });
    } catch (err) {
      console.error(`Gagal convert ${fullPath}:`, err);
    }
  }

  return results;
}

// CLI runner
if (import.meta.main) {
  console.log('🚀 Memulai konversi otomatis gambar ke WebP...');
  
  const targetDirs = [
    path.resolve(process.cwd(), 'apps/web/static'),
    path.resolve(process.cwd(), 'apps/admin/static')
  ];

  let totalBefore = 0;
  let totalAfter = 0;

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) continue;
    const res = await convertDirectoryImages(dir, { quality: 85, effort: 6 });
    for (const r of res) {
      console.log(` ✨ ${r.file}: ${r.inKb} KB -> ${r.outKb} KB (Hemat: ${r.saving}%)`);
      totalBefore += parseFloat(r.inKb);
      totalAfter += parseFloat(r.outKb);
    }
  }

  if (totalBefore > 0) {
    const totalSaving = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
    console.log(`\n🎉 Selesai! Total ukuran: ${totalBefore.toFixed(1)} KB -> ${totalAfter.toFixed(1)} KB (Total Penghematan: ${totalSaving}%)`);
  } else {
    console.log('Semua file sudah optimal.');
  }
}

