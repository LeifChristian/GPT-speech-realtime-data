const axios = require('axios');
const { formatSerpResults } = require('./format');

async function searchBrave(query) {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    return { error: 'Brave Search API key is not configured. Set BRAVE_API_KEY.' };
  }

  const q = String(query || '').slice(0, 400);
  console.log('[BRAVE] web search', { query: q.slice(0, 160) });

  const { data } = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
    params: {
      q,
      count: 10,
      search_lang: 'en',
      country: 'US',
    },
    timeout: 15000,
  });

  const results = (data?.web?.results || [])
    .filter((item) => item?.url && item?.title)
    .map((item) => ({
      title: item.title,
      url: item.url,
      description: item.description || item.extra_snippets?.[0] || '',
    }));

  console.log('[BRAVE] results', results.length);
  if (!results.length) {
    return { text: 'No results found.' };
  }

  return { text: formatSerpResults(results) };
}

module.exports = { searchBrave };
