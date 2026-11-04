import { createHmac, timingSafeEqual, randomUUID, scryptSync, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { env } from '../config/env';

interface TokenPayload {
  u: string;
  iat: number;
  exp: number;
  jti: string;
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

// In-memory rate limiting and lockout state
const attemptRecords = new Map<string, AttemptRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// Clean up stale attempt records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attemptRecords.entries()) {
    if (record.lockedUntil && record.lockedUntil < now) {
      attemptRecords.delete(key);
    } else if (now - record.firstAttempt > ATTEMPT_WINDOW_MS && !record.lockedUntil) {
      attemptRecords.delete(key);
    }
  }
}, 10 * 60 * 1000);

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function checkLockout(identifier: string): { isLocked: boolean; remainingSeconds: number } {
  const record = attemptRecords.get(identifier);
  if (!record || !record.lockedUntil) {
    return { isLocked: false, remainingSeconds: 0 };
  }

  const now = Date.now();
  if (now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }

  // Lockout expired, reset record
  attemptRecords.delete(identifier);
  return { isLocked: false, remainingSeconds: 0 };
}

export function recordFailedAttempt(identifier: string): {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutSeconds: number;
} {
  const now = Date.now();
  let record = attemptRecords.get(identifier);

  if (!record || now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    record = { count: 1, firstAttempt: now, lockedUntil: null };
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    attemptRecords.set(identifier, record);
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000)
    };
  }

  attemptRecords.set(identifier, record);
  return {
    isLocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - record.count,
    lockoutSeconds: 0
  };
}

export function resetAttempts(identifier: string) {
  attemptRecords.delete(identifier);
}

/**
 * Timing-safe string comparison to protect against side-channel timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// ============================================================================
// CREDENTIAL STORAGE & HASHING (Scrypt + Salt)
// ============================================================================

interface StoredCredentials {
  username: string;
  salt: string;
  passwordHash: string;
  updatedAt: string;
}

let activeCredentials: { username: string; salt: string; passwordHash: string } | null = null;

function getCredentialsFilePath(): string {
  const candidate1 = join(process.cwd(), 'data', 'credentials.json');
  if (existsSync(candidate1)) return candidate1;
  const candidate2 = join(process.cwd(), 'apps', 'api', 'data', 'credentials.json');
  if (existsSync(candidate2)) return candidate2;
  return candidate1;
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

function loadCredentials(): { username: string; salt: string; passwordHash: string } {
  if (activeCredentials) return activeCredentials;

  const filePath = getCredentialsFilePath();
  if (existsSync(filePath)) {
    try {
      const data: StoredCredentials = JSON.parse(readFileSync(filePath, 'utf-8'));
      if (data.username && data.salt && data.passwordHash) {
        activeCredentials = {
          username: data.username,
          salt: data.salt,
          passwordHash: data.passwordHash
        };
        return activeCredentials;
      }
    } catch (e) {
      console.error('Failed reading credentials.json, initializing from env', e);
    }
  }

  // Initialize from default env configuration
  const defaultSalt = randomBytes(16).toString('hex');
  const defaultHash = hashPassword(env.ADMIN_PASSWORD, defaultSalt);

  activeCredentials = {
    username: env.ADMIN_USERNAME,
    salt: defaultSalt,
    passwordHash: defaultHash
  };

  try {
    const dir = join(process.cwd(), 'data');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(
      filePath,
      JSON.stringify(
        {
          username: activeCredentials.username,
          salt: activeCredentials.salt,
          passwordHash: activeCredentials.passwordHash,
          updatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch (err) {
    console.warn('Could not save initial credentials.json:', err);
  }

  return activeCredentials;
}

export function getAdminUsername(): string {
  return loadCredentials().username;
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const creds = loadCredentials();
  const validUser = secureCompare(username.trim(), creds.username.trim());

  // Check against salted scrypt hash
  const computedHash = hashPassword(password, creds.salt);
  const validPass = secureCompare(computedHash, creds.passwordHash);

  // Fallback to env password if matching
  const validEnvPass = secureCompare(password, env.ADMIN_PASSWORD);

  return validUser && (validPass || validEnvPass);
}

export function updateAdminCredentials(data: {
  currentPassword: string;
  newUsername?: string;
  newPassword?: string;
}): { success: boolean; error?: string; username: string } {
  const creds = loadCredentials();

  // 1. Verify current password
  const currentComputedHash = hashPassword(data.currentPassword, creds.salt);
  const isMatch =
    secureCompare(currentComputedHash, creds.passwordHash) ||
    secureCompare(data.currentPassword, env.ADMIN_PASSWORD);

  if (!isMatch) {
    return {
      success: false,
      error: 'Password saat ini salah. Konfirmasi keamanan gagal.',
      username: creds.username
    };
  }

  // 2. Validate new username if specified
  let targetUsername = creds.username;
  if (data.newUsername && data.newUsername.trim()) {
    const trimmedUser = data.newUsername.trim();
    if (trimmedUser.length < 3) {
      return {
        success: false,
        error: 'Username baru minimal harus terdiri dari 3 karakter.',
        username: creds.username
      };
    }
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(trimmedUser)) {
      return {
        success: false,
        error: 'Username hanya boleh terdiri dari huruf, angka, titik (.), strip (-), atau garis bawah (_).',
        username: creds.username
      };
    }
    targetUsername = trimmedUser;
  }

  // 3. Validate new password if specified
  let targetSalt = creds.salt;
  let targetHash = creds.passwordHash;
  if (data.newPassword && data.newPassword.trim()) {
    const trimmedPass = data.newPassword.trim();
    if (trimmedPass.length < 8) {
      return {
        success: false,
        error: 'Password baru minimal harus terdiri dari 8 karakter.',
        username: creds.username
      };
    }
    targetSalt = randomBytes(16).toString('hex');
    targetHash = hashPassword(trimmedPass, targetSalt);
  }

  if (targetUsername === creds.username && targetHash === creds.passwordHash) {
    return {
      success: false,
      error: 'Tidak ada perubahan pada username ataupun password.',
      username: creds.username
    };
  }

  // 4. Update memory state
  activeCredentials = {
    username: targetUsername,
    salt: targetSalt,
    passwordHash: targetHash
  };

  // 5. Persist to data/credentials.json
  const filePath = getCredentialsFilePath();
  try {
    writeFileSync(
      filePath,
      JSON.stringify(
        {
          username: targetUsername,
          salt: targetSalt,
          passwordHash: targetHash,
          updatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed writing credentials.json:', err);
  }

  // 6. Update .env files for consistency
  try {
    const envPaths = [
      join(process.cwd(), '.env'),
      join(process.cwd(), 'apps', 'api', '.env')
    ];
    for (const p of envPaths) {
      if (existsSync(p)) {
        let content = readFileSync(p, 'utf-8');
        content = content.replace(/ADMIN_USERNAME=.*/g, `ADMIN_USERNAME="${targetUsername}"`);
        if (data.newPassword && data.newPassword.trim()) {
          content = content.replace(/ADMIN_PASSWORD=.*/g, `ADMIN_PASSWORD="${data.newPassword.trim()}"`);
        }
        writeFileSync(p, content, 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Could not sync .env file:', err);
  }

  return { success: true, username: targetUsername };
}

export function generateToken(username: string): { token: string; expiresAt: string } {
  const now = Date.now();
  const exp = now + 8 * 60 * 60 * 1000; // 8 hours validity

  const payload: TokenPayload = {
    u: username,
    iat: now,
    exp,
    jti: randomUUID()
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadEncoded, env.AUTH_SECRET);
  const token = `${payloadEncoded}.${signature}`;

  return {
    token,
    expiresAt: new Date(exp).toISOString()
  };
}

export function verifyToken(token: string): { valid: boolean; username?: string; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token' };
  }

  const [payloadEncoded, signature] = parts;
  const expectedSignature = sign(payloadEncoded, env.AUTH_SECRET);

  if (!secureCompare(signature, expectedSignature)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payload: TokenPayload = JSON.parse(base64UrlDecode(payloadEncoded));
    if (Date.now() > payload.exp) {
      return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, username: payload.u };
  } catch {
    return { valid: false, error: 'Failed to decode token payload' };
  }
}
