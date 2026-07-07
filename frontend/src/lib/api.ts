import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = sessionStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken } = res.data as { accessToken: string };
        sessionStorage.setItem('access_token', accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error instanceof Error ? error : new Error(error?.response?.data?.error ?? 'Request failed'));
  },
);

export default api;
