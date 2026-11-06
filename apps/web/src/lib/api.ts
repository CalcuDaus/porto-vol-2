import type { ApiResponse, SiteContent, FontOption, ContactFormInput } from './types';
import { defaultContent } from './data/defaultContent';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      ...options
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data: ApiResponse<T> = await res.json();
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    return {
      success: false,
      error: message,
      message: 'Failed to communicate with API server',
      timestamp: new Date().toISOString()
    };
  }
}

export const api = {
  getContent: async (): Promise<ApiResponse<SiteContent>> => {
    const res = await request<SiteContent>('/content');
    if (res.success && res.data) {
      return res;
    }
    // Graceful fallback to bundled defaultContent for zero-failure serverless/offline deploys
    return {
      success: true,
      data: defaultContent,
      timestamp: new Date().toISOString()
    };
  },
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
  sendContact: (payload: ContactFormInput) =>
    request<{ id: string; status: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
