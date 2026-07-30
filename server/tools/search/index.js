const { searchBrave } = require('./brave');
const { searchPerplexity } = require('./perplexity');
const { searchBing } = require('./bing');
const { getBraveApiKey, getBingApiKey } = require('../../config/env');

const SEARCH_HANDLERS = {
  brave: searchBrave,
  perplexity: searchPerplexity,
  bing: searchBing,
};

function resolveSearchProvider(provider = 'perplexity') {
  const normalized = String(provider || 'perplexity').toLowerCase();

  if (normalized === 'brave' && !getBraveApiKey() && getBingApiKey()) {
    console.log('[SEARCH] brave key missing; falling back to legacy Bing');
    return 'bing';
  }

  if (SEARCH_HANDLERS[normalized]) {
    return normalized;
  }

  return 'perplexity';
}

async function runWebSearch(query, provider = 'perplexity') {
  const effectiveProvider = resolveSearchProvider(provider);
  const handler = SEARCH_HANDLERS[effectiveProvider] || SEARCH_HANDLERS.perplexity;

  try {
    const result = await handler(query);
    if (result.error) {
      return result.error;
    }
    return result.text || 'No results found.';
  } catch (error) {
    const status = error.response?.status;
    console.error(`[SEARCH][${effectiveProvider}] Error`, { status, message: error.message });
    return `Error fetching search results (${effectiveProvider}): ${status || error.message}`.trim();
  }
}

module.exports = {
  runWebSearch,
  resolveSearchProvider,
  SEARCH_HANDLERS,
};
