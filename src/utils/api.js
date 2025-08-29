// Centralized API base URL helper
const apiBase = (() => {
  const envBase = process.env.REACT_APP_API_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const fromMeta = document.querySelector('meta[name="api-base"]')?.getAttribute('content');
    if (fromMeta) return fromMeta.replace(/\/$/, '');
  }
  // Fallbacks: development proxy or same-origin
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3001';
  return '';
})();

export const apiUrl = (path) => {
  const cleanPath = String(path || '').replace(/^\//, '');
  if (!apiBase) return `/${cleanPath}`;
  return `${apiBase}/${cleanPath}`;
};

export default apiUrl;


