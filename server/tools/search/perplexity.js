const axios = require('axios');
const { formatSerpResults } = require('./format');

async function searchPerplexity(query) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return { error: 'Perplexity API key is not configured. Set PERPLEXITY_API_KEY.' };
  }

  console.log('[PPLX] live search', { query: String(query || '').slice(0, 160) });

  const system = [
    'You are a research assistant with live web access. Perform real-time public web search and aggregate findings.',
    'Return up to 10 items with EXACTLY this text-only structure per item:',
    'Name: <title>\\nLink: <https url>\\nSnippet: <concise summary>\\n',
    'Links are MANDATORY. Keep output concise for TTS.',
  ].join(' ');

  const model = process.env.PPLX_MODEL || 'sonar-pro';
  const resp = await axios.post(
    'https://api.perplexity.ai/chat/completions',
    {
      model,
      temperature: 0.2,
      return_citations: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: String(query || '').slice(0, 4000) },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  let text = resp?.data?.choices?.[0]?.message?.content?.trim();
  const citations = resp?.data?.citations || resp?.data?.choices?.[0]?.message?.citations || [];

  if (!/https?:\/\//i.test(text || '') && Array.isArray(citations) && citations.length) {
    const items = citations.slice(0, 10).map((u, idx) => ({
      title: `Source ${idx + 1}`,
      url: typeof u === 'string' ? u : u?.url || '',
      description: 'See source.',
    }));
    const citeBlock = formatSerpResults(items.filter((i) => i.url));
    text = text ? `${text}\n\n${citeBlock}` : citeBlock;
  }

  return { text: text || 'No results found.' };
}

module.exports = { searchPerplexity };
