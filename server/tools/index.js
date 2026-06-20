const axios = require('axios');

async function get_population(city) {
  const minPopulation = 1;
  const maxPopulation = 22;
  const randomPopulation =
    Math.floor(Math.random() * (maxPopulation - minPopulation + 1)) + minPopulation;
  return JSON.stringify({
    city,
    population: randomPopulation.toString(),
  });
}

async function get_current_weather({ location, unit = 'fahrenheit' }) {
  try {
    console.log(`[WEATHER] Fetching for location: ${location}, unit: ${unit}`);
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=imperial&appid=${process.env.weatherAPIKey}`
    );
    const weatherData = await weatherResponse.json();

    if (!weatherData?.main || typeof weatherData.main.temp === 'undefined') {
      console.error(`[WEATHER] Invalid data: ${JSON.stringify(weatherData)}`);
      return JSON.stringify({ status: 'error', message: 'Weather data unavailable' });
    }

    return JSON.stringify({
      location: weatherData.name,
      temperature: Math.round(weatherData.main.temp),
      unit: unit === 'fahrenheit' ? 'F' : 'C',
      forecast: weatherData.weather[0].description,
    });
  } catch (error) {
    console.error(`[WEATHER] Error: ${error.message}`);
    return JSON.stringify({ status: 'error', message: 'Failed to fetch weather' });
  }
}

async function get_news(query) {
  const apiKey = process.env.newsAPIKey || process.env.NEWS_API_KEY || process.env.NEWSDATA_API_KEY;
  const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}`;

  try {
    if (!apiKey) {
      return 'Error: News API key is not configured on the server.';
    }
    const response = await axios.get(url);
    let result = '';
    if (response.data.status === 'success' && response.data.results) {
      response.data.results.forEach((article) => {
        result += `Title: ${article.title}\n`;
        result += `Description: ${article.description}\n`;
        result += `Published Date: ${article.pubDate}\n\n`;
      });
    }
    return result || 'No news found for that query.';
  } catch (error) {
    console.error('[NEWS] Error', error.message);
    return `Error fetching news: ${error.response?.status || ''}`.trim();
  }
}

async function get_shows(query) {
  const apiKey = process.env.showsAPIKey;
  const apiHost = 'streaming-availability.p.rapidapi.com';
  const url = `https://streaming-availability.p.rapidapi.com/shows/search/filters?series_granularity=show&order_direction=asc&order_by=original_title&genres_relation=and&output_language=en&show_type=movie&country=US&keyword=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost,
      },
    });
    const data = await response.json();
    let result = '';

    if (data?.shows && Array.isArray(data.shows)) {
      data.shows.forEach((show) => {
        result += `Title: ${show.title}\n`;
        result += `Description: ${show.overview || 'No description available'}\n`;
        if (show.streamingOptions?.us?.length > 0) {
          result += `Link: ${show.streamingOptions.us[0].link}\n`;
        } else {
          result += 'Link: Not currently available for streaming.\n';
        }
        result += '\n';
      });
    } else {
      result = 'No shows found for this query.';
    }
    return result;
  } catch (error) {
    console.error('[SHOWS] Error', error.message);
    return `Error: ${error.message}`;
  }
}

async function get_realtime_data(query) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return 'Error: Perplexity API key is not configured on the server.';
  }

  try {
    console.log('[PPLX] live search HIT', { query: String(query || '').slice(0, 160) });
    const system = [
      'You are a research assistant with live web access. Perform real-time public web search and aggregate findings.',
      'Return up to 10 items with EXACTLY this text-only structure per item:',
      'Name: <title>\\nLink: <https url>\\nSnippet: <concise summary>\\n',
      'Links are MANDATORY. Keep output concise for TTS.',
    ].join(' ');

    const model = process.env.PPLX_MODEL || 'sonar-pro';
    const payload = {
      model,
      temperature: 0.2,
      return_citations: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: String(query || '').slice(0, 4000) },
      ],
    };

    const resp = await axios.post('https://api.perplexity.ai/chat/completions', payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });

    let text = resp?.data?.choices?.[0]?.message?.content?.trim();
    const citations = resp?.data?.citations || resp?.data?.choices?.[0]?.message?.citations || [];

    if (!/https?:\/\//i.test(text || '') && Array.isArray(citations) && citations.length) {
      const citeBlock = citations
        .slice(0, 10)
        .map((u, idx) => {
          const url = typeof u === 'string' ? u : u?.url || '';
          if (!url) return '';
          return `Name: Source ${idx + 1}\nLink: ${url}\nSnippet: See source.\n`;
        })
        .filter(Boolean)
        .join('\n');
      text = text ? `${text}\n\n${citeBlock}` : citeBlock;
    }

    return text || 'No results found.';
  } catch (error) {
    console.error('[PPLX] Error', error.message);
    return `Error fetching search results: ${error.response?.status || ''}`.trim();
  }
}

const TOOL_EXECUTORS = {
  get_current_weather: (args) => get_current_weather(args),
  get_population: (args) => get_population(args.city),
  get_realtime_data: (args) => get_realtime_data(args.query),
  get_news: (args) => get_news(args.query),
  get_shows: (args) => get_shows(args.query),
};

async function executeTool(name, args = {}) {
  const handler = TOOL_EXECUTORS[name];
  if (!handler) {
    return `Unsupported tool: ${name}`;
  }
  const result = await handler(args);
  if (typeof result === 'string') return result;
  return JSON.stringify(result ?? '');
}

function serializeToolResult(result) {
  if (typeof result === 'string') return result;
  return JSON.stringify(result ?? '');
}

module.exports = {
  executeTool,
  serializeToolResult,
  TOOL_EXECUTORS,
};
