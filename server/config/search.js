const SEARCH_PROVIDERS = [
  {
    id: 'brave',
    label: 'Brave Search',
    description: 'Raw web results (Bing-style) — your chat model summarizes',
    envKey: 'BRAVE_API_KEY',
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    description: 'AI search with pre-summarized answers',
    envKey: 'PERPLEXITY_API_KEY',
  },
];

const DEFAULT_SEARCH_PROVIDER = (process.env.SEARCH_PROVIDER || 'brave').toLowerCase();

function getConfiguredSearchProviders() {
  return {
    brave: !!process.env.BRAVE_API_KEY,
    perplexity: !!process.env.PERPLEXITY_API_KEY,
  };
}

function listSearchProviders() {
  const configured = getConfiguredSearchProviders();
  return SEARCH_PROVIDERS.map(({ id, label, description }) => ({
    id,
    label,
    description,
    configured: configured[id],
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
      `Search provider "${id}" is not configured. Set ${entry?.envKey || 'the API key'} in the environment.`
    );
  }
}

function resolveDefaultSearchProvider() {
  const configured = getConfiguredSearchProviders();
  if (configured[DEFAULT_SEARCH_PROVIDER]) {
    return DEFAULT_SEARCH_PROVIDER;
  }
  if (configured.brave) return 'brave';
  if (configured.perplexity) return 'perplexity';
  return DEFAULT_SEARCH_PROVIDER;
}

module.exports = {
  SEARCH_PROVIDERS,
  getConfiguredSearchProviders,
  listSearchProviders,
  validateSearchProvider,
  resolveDefaultSearchProvider,
};
