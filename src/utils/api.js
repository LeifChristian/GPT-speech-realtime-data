// Centralized API base URL helper
const apiBase = (() => {
  const envBase = process.env.REACT_APP_API_BASE_URL;
  if (envBase) {
    try {
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const isLocalHost = host === 'localhost' || host === '127.0.0.1';
        // Ignore a localhost base when the app is not running on localhost
        if (!isLocalHost && /^https?:\/\/localhost(?::\d+)?/i.test(envBase)) {
          // fall through to same-origin
        } else {
          return envBase.replace(/\/$/, '');
        }
      } else {
        return envBase.replace(/\/$/, '');
      }
    } catch { }
  }
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

// Debug wrapper around fetch
export async function debugFetch(label, url, options, pushDebug) {
  const startedAt = Date.now();
  try {
    const res = await fetch(url, options);
    const clone = res.clone();
    let bodyPreview = '';
    try { bodyPreview = await clone.text(); } catch { }
    const text = [
      `REQUEST ${label}`,
      `URL: ${url}`,
      `Method: ${(options && options.method) || 'GET'}`,
      `Status: ${res.status}`,
      `Duration: ${Date.now() - startedAt}ms`,
      `Body (first 512):`,
      bodyPreview.slice(0, 512)
    ].join('\n');
    pushDebug && pushDebug({ ts: startedAt, label, text });
    return res;
  } catch (err) {
    const text = [
      `REQUEST ${label} FAILED`,
      `URL: ${url}`,
      `Method: ${(options && options.method) || 'GET'}`,
      `Error: ${err.message}`
    ].join('\n');
    pushDebug && pushDebug({ ts: startedAt, label, text });
    throw err;
  }
}

export default apiUrl;


