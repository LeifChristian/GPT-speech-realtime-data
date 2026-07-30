const axios = require('axios');
const { formatSerpResults } = require('./format');
const { getBingApiKey } = require('../../config/env');

async function searchBing(query) {
  const apiKey = getBingApiKey();
  if (!apiKey) {
    return {
      error:
        'Bing Search API key is not configured. Set bingAPIKey, BING_API_KEY, or BINGAPIKEY.',
    };
  }

  const q = String(query || '').slice(0, 400);
  console.log('[BING] web search', { query: q.slice(0, 160) });

  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&count=10&mkt=en-US`;

  const { data } = await axios.get(url, {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    timeout: 15000,
  });

  const results = (data?.webPages?.value || [])
    .filter((item) => item?.url && item?.name)
    .map((item) => ({
      title: item.name,
      url: item.url,
      description: item.snippet || '',
    }));

  console.log('[BING] results', results.length);
  if (!results.length) {
    return { text: 'No results found.' };
  }

  return { text: formatSerpResults(results) };
}

module.exports = { searchBing };
