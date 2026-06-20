const axios = require('axios');
const { runWebSearch } = require('./search');

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

async function get_realtime_data(query, searchProvider = 'brave') {
  return runWebSearch(query, searchProvider);
}

const TOOL_EXECUTORS = {
  get_current_weather: (args) => get_current_weather(args),
  get_population: (args) => get_population(args.city),
  get_realtime_data: (args, ctx) => get_realtime_data(args.query, ctx?.searchProvider),
  get_news: (args) => get_news(args.query),
  get_shows: (args) => get_shows(args.query),
};

async function executeTool(name, args = {}, context = {}) {
  const handler = TOOL_EXECUTORS[name];
  if (!handler) {
    return `Unsupported tool: ${name}`;
  }
  const result = await handler(args, context);
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
