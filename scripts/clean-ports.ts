import { execSync } from 'node:child_process';

const PORTS = [3002, 5174, 5175];
const currentPid = process.pid;

console.log('🧹 [Port Guard] Memeriksa port layanan [3002, 5174, 5175]...');

for (const port of PORTS) {
  try {
    if (process.platform === 'win32') {
      const output = execSync('netstat -ano -p tcp', { encoding: 'utf-8' });
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes(`:${port}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[parts.length - 1], 10);
          if (pid && pid !== currentPid && pid !== 0 && pid !== 4) {
            console.log(`⚠️ Port ${port} masih dipakai oleh proses PID ${pid}. Menghentikan proses sisa...`);
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              console.log(`✅ Port ${port} berhasil dibebaskan (PID ${pid} ditutup).`);
            } catch {
              // ignore
            }
          }
        }
      }
    } else {
      // macOS / Linux fallback
      try {
        const pids = execSync(`lsof -t -i:${port}`, { encoding: 'utf-8' }).trim().split('\n');
        for (const p of pids) {
          const pid = parseInt(p.trim(), 10);
          if (pid && pid !== currentPid) {
            execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            console.log(`✅ Port ${port} berhasil dibebaskan.`);
          }
        }
      } catch {
        // port is already free
      }
    }
  } catch {
    // continue
  }
}

console.log('✨ [Port Guard] Semua port telah bersih dan siap digunakan.');

