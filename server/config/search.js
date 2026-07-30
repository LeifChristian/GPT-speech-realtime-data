const {
  getPerplexityApiKey,
  getBraveApiKey,
  getBingApiKey,
} = require('./env');

const SEARCH_PROVIDERS = [
  {
    id: 'perplexity',
    label: 'Perplexity',
    description: 'AI search with pre-summarized answers',
    envKeys: ['PERPLEXITY_API_KEY', 'perplexityAPIKey', 'searchAPIKey'],
  },
  {
    id: 'brave',
    label: 'Brave Search',
    description: 'Raw web results — your chat model summarizes',
    envKeys: ['BRAVE_API_KEY', 'braveAPIKey'],
  },
  {
    id: 'bing',
    label: 'Bing Search',
    description: 'Legacy Microsoft Bing web search',
    envKeys: ['bingAPIKey', 'BING_API_KEY', 'BINGAPIKEY'],
  },
];

function getConfiguredSearchProviders() {
  return {
    perplexity: !!getPerplexityApiKey(),
    brave: !!getBraveApiKey(),
    bing: !!getBingApiKey(),
  };
}

function listSearchProviders() {
  const configured = getConfiguredSearchProviders();
  return SEARCH_PROVIDERS.map(({ id, label, description, envKeys }) => ({
    id,
    label,
    description,
    configured: configured[id],
    envKeys,
  }));
}

function validateSearchProvider(id) {
  const allowed = SEARCH_PROVIDERS.map((p) => p.id);
  if (!allowed.includes(id)) {
    throw new Error(`Invalid search provider "${id}". Allowed: ${allowed.join(', ')}`);
  }
  const configured = getConfiguredSearchProviders();
  if (!configured[id]) {
    const entry = SEARCH_PROVIDERS.find((p) => p.id === id);
    throw new Error(
      `Search provider "${id}" is not configured. Set one of: ${(entry?.envKeys || []).join(', ')}`
    );
  }
}

function resolveDefaultSearchProvider() {
  const configured = getConfiguredSearchProviders();
  const explicit = (process.env.SEARCH_PROVIDER || '').trim().toLowerCase();

  if (explicit && configured[explicit]) {
    return explicit;
  }

  // Pre-refactor prod typically used Perplexity (perplexityAPIKey) for get_realtime_data.
  if (configured.perplexity) return 'perplexity';
  if (configured.brave) return 'brave';
  if (configured.bing) return 'bing';

  return explicit || 'perplexity';
}

module.exports = {
  SEARCH_PROVIDERS,
  getConfiguredSearchProviders,
  listSearchProviders,
  validateSearchProvider,
  resolveDefaultSearchProvider,
};
