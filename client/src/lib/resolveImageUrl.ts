const API_BASE_URL =
  (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

export const resolveImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return url;
  if (url.startsWith('/')) return API_BASE_URL + url;
  return url;
};