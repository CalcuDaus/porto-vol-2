import type { ApiResponse, SiteContent, FontOption, LoginResponse, AuthUser } from './types';

const API_BASE = '/api/v1';
const TOKEN_KEY = 'porto_admin_token';

let memoryToken: string | null = null;

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(TOKEN_KEY) || memoryToken;
  }
  return memoryToken;
}

export function setToken(token: string | null) {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }
}

export function clearToken() {
  setToken(null);
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const token = getToken();
    const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options?.headers as Record<string, string>) || {})
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data: ApiResponse<T> = await res.json();

    if (res.status === 401 && endpoint !== '/auth/login') {
      // Session has expired or token is invalid
      clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-expired'));
      }
    }

    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    return {
      success: false,
      error: message,
      message: 'Failed to communicate with Elysia API server',
      timestamp: new Date().toISOString()
    };
  }
}

export const api = {
  // Auth endpoints
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  verifySession: () => request<AuthUser>('/auth/me'),

  logout: () =>
    request<{ loggedOut: boolean }>('/auth/logout', {
      method: 'POST'
    }),

  updateCredentials: (data: {
    currentPassword: string;
    newUsername?: string;
    newPassword?: string;
  }) =>
    request<{ username: string; token: string; expiresAt: string }>('/auth/credentials', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Content endpoints
  getContent: () => request<SiteContent>('/content'),
  getFonts: () => request<FontOption[]>('/content/fonts'),

  updateContent: (content: SiteContent) =>
    request<SiteContent>('/content', {
      method: 'PUT',
      body: JSON.stringify(content)
    }),

  updateSection: <T>(section: string, data: T) =>
    request<T>(`/content/${section}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  uploadCv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ url: string }>('/content/upload-cv', {
      method: 'POST',
      body: formData
    });
  },

  uploadImage: (file: File, name: string = 'avatar') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    return request<{ url: string; size: number; originalSize: number; saving: string }>('/content/upload-image', {
      method: 'POST',
      body: formData
    });
  }
};
