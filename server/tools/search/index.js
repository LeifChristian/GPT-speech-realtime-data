const { searchBrave } = require('./brave');
const { searchPerplexity } = require('./perplexity');

const SEARCH_HANDLERS = {
  brave: searchBrave,
  perplexity: searchPerplexity,
};

async function runWebSearch(query, provider = 'brave') {
  const handler = SEARCH_HANDLERS[provider] || SEARCH_HANDLERS.brave;
  try {
    const result = await handler(query);
    if (result.error) {
      return result.error;
    }
    return result.text || 'No results found.';
  } catch (error) {
    const status = error.response?.status;
    console.error(`[SEARCH][${provider}] Error`, { status, message: error.message });
    return `Error fetching search results (${provider}): ${status || error.message}`.trim();
  }
}

module.exports = {
  runWebSearch,
  SEARCH_HANDLERS,
};
