export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  meta?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(
  path: string, 
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`;
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    ...init,
  });

  let json: any = {};
  try {
    json = await response.json();
  } catch {
    // Handle non-JSON responses
  }

  if (!response.ok) {
    const error = json.error || {};
    throw new ApiError(
      error.code || 'UNKNOWN_ERROR',
      error.message || response.statusText,
      response.status,
      error.details
    );
  }

  return json;
}

// Convenience methods
export const apiGet = <T>(path: string, params?: Record<string, any>) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
  }
  const queryString = searchParams.toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;
  return api<T>(fullPath);
};

export const apiPost = <T>(path: string, data?: any) =>
  api<T>(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPatch = <T>(path: string, data: any) =>
  api<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const apiDelete = (path: string) =>
  api(path, { method: 'DELETE' });

export const apiUpload = <T>(path: string, formData: FormData) =>
  api<T>(path, {
    method: 'POST',
    headers: {}, // Let browser set Content-Type for multipart
    body: formData,
  });