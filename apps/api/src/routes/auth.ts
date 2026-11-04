import { Elysia, t } from 'elysia';
import { createSuccessResponse, createErrorResponse } from '../types/api';
import {
  verifyAdminCredentials,
  updateAdminCredentials,
  generateToken,
  verifyToken,
  checkLockout,
  recordFailedAttempt,
  resetAttempts
} from '../auth/service';

export const authRoutes = new Elysia({ prefix: '/auth' })
  // POST /api/v1/auth/login
  .post(
    '/login',
    async ({ body, headers, set }) => {
      const { username, password } = body;
      // Client identifier from IP or fallback to username
      const clientIp = (headers['x-forwarded-for'] as string) || 'client-ip';
      const identifier = `${clientIp}:${username}`;

      // 1. Anti-Brute-Force Lockout Check
      const lockout = checkLockout(identifier);
      if (lockout.isLocked) {
        set.status = 429;
        return createErrorResponse(
          'ACCOUNT_LOCKED',
          `Terlalu banyak percobaan gagal. Akun dikunci sementara selama ${lockout.remainingSeconds} detik.`
        );
      }

      // 2. Validate Credentials
      const isValid = verifyAdminCredentials(username, password);

      if (!isValid) {
        // Record failed attempt & calculate remaining
        const failStatus = recordFailedAttempt(identifier);

        // Security artificial jitter / delay against timing attacks (400ms - 800ms)
        await Bun.sleep(500);

        if (failStatus.isLocked) {
          set.status = 429;
          return createErrorResponse(
            'ACCOUNT_LOCKED',
            `Terlalu banyak percobaan gagal. Akses dikunci selama ${failStatus.lockoutSeconds} detik.`
          );
        }

        set.status = 401;
        return createErrorResponse(
          'INVALID_CREDENTIALS',
          `Username atau password salah. Sisa percobaan: ${failStatus.remainingAttempts}x sebelum akun dikunci.`
        );
      }

      // 3. Success: Reset rate limiter and generate signed token
      resetAttempts(identifier);
      const { token, expiresAt } = generateToken(username);

      return createSuccessResponse(
        {
          token,
          expiresAt,
          user: {
            username,
            role: 'admin'
          }
        },
        'Login berhasil'
      );
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 })
      })
    }
  )

  // GET /api/v1/auth/me (Verify active session token)
  .get('/me', ({ headers, set }) => {
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      return createErrorResponse('UNAUTHORIZED', 'Header Authorization Bearer diperlukan');
    }

    const token = authHeader.substring(7).trim();
    const result = verifyToken(token);

    if (!result.valid || !result.username) {
      set.status = 401;
      return createErrorResponse('INVALID_TOKEN', result.error || 'Token sesi tidak valid atau kedaluwarsa');
    }

    return createSuccessResponse(
      {
        username: result.username,
        role: 'admin'
      },
      'Sesi terautentikasi'
    );
  })

  // PUT /api/v1/auth/credentials (Protected - Update admin username / password)
  .put(
    '/credentials',
    async ({ body, headers, set }) => {
      const authHeader = headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return createErrorResponse('UNAUTHORIZED', 'Header Authorization Bearer diperlukan');
      }

      const token = authHeader.substring(7).trim();
      const verifyResult = verifyToken(token);
      if (!verifyResult.valid) {
        set.status = 401;
        return createErrorResponse('INVALID_TOKEN', 'Sesi login tidak valid atau telah kedaluwarsa');
      }

      const { currentPassword, newUsername, newPassword } = body;

      const updateResult = updateAdminCredentials({
        currentPassword,
        newUsername,
        newPassword
      });

      if (!updateResult.success) {
        set.status = 400;
        return createErrorResponse('UPDATE_FAILED', updateResult.error || 'Gagal mengubah kredensial');
      }

      // Generate a refreshed token with the new username
      const { token: newToken, expiresAt } = generateToken(updateResult.username);

      return createSuccessResponse(
        {
          username: updateResult.username,
          token: newToken,
          expiresAt
        },
        'Kredensial akun administrator berhasil diperbarui'
      );
    },
    {
      body: t.Object({
        currentPassword: t.String({ minLength: 1 }),
        newUsername: t.Optional(t.String()),
        newPassword: t.Optional(t.String())
      })
    }
  )

  // POST /api/v1/auth/logout
  .post('/logout', () => {
    return createSuccessResponse({ loggedOut: true }, 'Berhasil keluar');
  });
