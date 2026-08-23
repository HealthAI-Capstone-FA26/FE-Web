const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const getAvatarUrl = (avatar?: string) => {
  if (!avatar) return '';
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  const baseUrl = import.meta.env.VITE_UPLOAD_BASE_URL || 'http://localhost:9000/app-uploads';
  return `${baseUrl}/${avatar}`;
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = localStorage.getItem('access_token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else if (!options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Tự động làm mới Token (Silent Refresh) khi gặp lỗi 401 Unauthorized
  if (
    response.status === 401 &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh-token')
  ) {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      if (isRefreshing) {
        // Nếu đang trong quá trình refresh token, cho request chờ trong queue
        await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        token = localStorage.getItem('access_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        isRefreshing = true;
        try {
          const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.accessToken) {
              localStorage.setItem('access_token', data.accessToken);
            }
            if (data.refreshToken) {
              localStorage.setItem('refresh_token', data.refreshToken);
            }

            processQueue(null);

            // Thử lại request gốc với token mới vừa nhận
            token = data.accessToken;
            headers['Authorization'] = `Bearer ${token}`;
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers,
            });
          } else {
            // Refresh token cũng đã hết hạn/không hợp lệ -> Đăng xuất người dùng
            processQueue(new Error('Session expired'));
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('4am_is_logged_in');
            localStorage.removeItem('4am_user_data');
            window.location.href = '/';
          }
        } catch (refreshErr) {
          processQueue(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || `Lỗi yêu cầu (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
