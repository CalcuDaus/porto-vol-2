import { verifyToken } from './service';
import { createErrorResponse } from '../types/api';

export function checkAuth(headers: Record<string, string | undefined>): {
  authorized: boolean;
  username?: string;
  error?: string;
} {
  const authHeader = headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      error: 'Token autentikasi diperlukan (Authorization: Bearer <token>)'
    };
  }

  const token = authHeader.substring(7).trim();
  const res = verifyToken(token);
  if (!res.valid || !res.username) {
    return {
      authorized: false,
      error: res.error || 'Token sesi tidak valid atau sudah kedaluwarsa'
    };
  }

  return { authorized: true, username: res.username };
}

