export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string; // ISO 8601 UTC
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(error: string, message?: string): ApiResponse<never> {
  return {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString()
  };
}

