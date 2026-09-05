// Same-origin: frontend and API live in one Vercel deployment.
const API_BASE_URL = '/api';

export const resolveImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return url;
  if (url.startsWith('/')) return API_BASE_URL + url;
  return url;
};