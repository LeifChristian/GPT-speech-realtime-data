
// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const { checkAuth, checkChatAuth } = require('../middleware/authMiddleware');

// // API Function Definitions
// async function getSearchResults(query) {
//   const params = {
//     engine: "duckduckgo",
//     q: query,
//     kl: "us-en"
//   };

//   try {
//     const response = await search.json(params);
//     return response;
//   } catch (error) {
//     console.error('Error:', error);
//     throw new Error('Failed to fetch search results');
//   }
// }

// async function get_population(city) {
//   const minPopulation = 1;
//   const maxPopulation = 22;
//   const randomPopulation = Math.floor(Math.random() * (maxPopulation - minPopulation + 1)) + minPopulation;
//   const populationData = {
//     city: city,
//     population: randomPopulation.toString(),
//   };
//   return JSON.stringify(populationData);
// }

// async function get_current_weather(location, unit = 'imperial') {
//   const apiKey = process.env.weatherAPIKey;
//   try {
//     const response = await axios.get(`http://api.weatherstack.com/current`, {
//       params: {
//         access_key: apiKey,
//         query: location,
//         units: unit === 'imperial' ? 'f' : 'm',
//       },
//     });
//     const weatherData = response.data;
//     const temperature = weatherData.current.temperature;
//     const locationName = weatherData.location.name;
//     return `Current temperature in ${locationName} is ${temperature} ${unit === 'imperial' ? 'F' : 'C'}`;
//   } catch (error) {
//     console.error('Error getting weather:', error);
//     throw new Error('Failed to get the current weather');
//   }
// }

// async function get_news(query) {
//   console.log(query, '<---- the query')
//   const apiKey = process.env.newsAPIKey;
//   const searchTerm = encodeURIComponent(query);
//   const apiBase = "https://newsdata.io/api/1/news";
//   const url = `${apiBase}?apikey=${apiKey}&q=${searchTerm}`;

//   try {
//     const response = await axios.get(url);
//     let result = '';
//     if (response.data.status === "success" && response.data.results) {
//       response.data.results.forEach(article => {
//         result += `Title: ${article.title}\n`;
//         result += `Description: ${article.description}\n`;
//         result += `Published Date: ${article.pubDate}\n\n`;
//       });
//     }
//     return result;
//   } catch (error) {
//     console.log(error);
//     return null;
//   }
// }

// async function get_shows(query) {
//   console.log(query, '<---- the query');
//   const apiKey = process.env.showsAPIKey;
//   const apiHost = 'streaming-availability.p.rapidapi.com';
//   const baseUrl = 'https://streaming-availability.p.rapidapi.com/shows/search/filters';
//   const url = `${baseUrl}?series_granularity=show&order_direction=asc&order_by=original_title&genres_relation=and&output_language=en&show_type=movie&country=US&keyword=${encodeURIComponent(query)}`;

//   const options = {
//     method: 'GET',
//     headers: {
//       'x-rapidapi-key': apiKey,
//       'x-rapidapi-host': apiHost
//     }
//   };

//   try {
//     const response = await fetch(url, options);
//     const data = await response.json();
//     let result = '';

//     if (data && data.shows && Array.isArray(data.shows)) {
//       data.shows.forEach((show) => {
//         result += `Title: ${show.title}\n`;
//         result += `Description: ${show.overview || 'No description available'}\n`;
//         if (show.streamingOptions && show.streamingOptions.us && show.streamingOptions.us.length > 0) {
//           result += `Link: ${show.streamingOptions.us[0].link}\n`;
//         } else {
//           result += 'Link: Not currently available for streaming.\n';
//         }
//         result += '\n';
//       });
//     } else {
//       result = "No shows found for this query.";
//     }
//     return result;
//   } catch (error) {
//     console.error(error);
//     return `Error: ${error.message}`;
//   }
// }

// async function get_realtime_data(query) {
//   const subscriptionKey = process.env.bingAPIKey;
//   const uriBase = "https://api.bing.microsoft.com/v7.0/search";
//   const searchTerm = encodeURIComponent(query);
//   const url = `${uriBase}?q=${searchTerm}&count=20&mkt=en-US`;

//   try {
//     const response = await axios.get(url, {
//       headers: {
//         'Ocp-Apim-Subscription-Key': subscriptionKey
//       }
//     });

//     let result = '';
//     if (response.data.webPages && response.data.webPages.value) {
//       response.data.webPages.value.forEach(webPage => {
//         result += `Name: ${webPage.name}\n`;
//         result += `Snippet: ${webPage.snippet}\n\n`;
//       });
//     }
//     return result;
//   } catch (error) {
//     console.log(error);
//     return null;
//   }
// }

// // OpenAI function definitions
// const functions = [
//   {
//     name: 'get_current_weather',
//     description: 'Get the current weather in a given location',
//     parameters: {
//       type: 'object',
//       properties: {
//         location: {
//           type: 'string',
//           description: 'The city and state, e.g. San Francisco, CA',
//         },
//         unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
//       },
//       required: ['location'],
//     },
//   },
//   {
//     name: 'get_population',
//     description: 'Get the population of a given city',
//     parameters: {
//       type: 'object',
//       properties: {
//         city: {
//           type: 'string',
//           description: 'The city name',
//         },
//       },
//       required: ['city'],
//     },
//   },
//   {
//     name: 'get_realtime_data',
//     description: 'Get current data and or info about anything more recent than September 2023. Use this if user ever asks for a `web search`. dont return urls. summarize responses and format for being spoken back to end user. remove the word snippet.',
//     parameters: {
//       type: 'object',
//       properties: {
//         query: {
//           type: 'string',
//           description: 'use data found from this search to be held as more important in the subsequent summary and response than training data',
//         },
//       },
//       required: ['query'],
//     },
//   },
//   {
//     name: 'get_news',
//     description: 'If asked anything related to news, use this function call. exclude urls and read more if part of the response. do NOT include urls in the response. exclude the text [Read More] etc',
//     parameters: {
//       type: 'object',
//       properties: {
//         query: {
//           type: 'string',
//           description: 'use data found from this search as more important and reliable than training data. do not include urls in the response',
//         },
//       },
//       required: ['query'],
//     },
//   },
//   {
//     name: 'get_shows',
//     description: 'get streaming media links and return to user. formulate the query with as few words as possible for refined search. remove name of any streaming service from the query created, for example This Movie on netflix becomes just This Movie, `robert deniro movies` becomes just `robert deniro` so you have to trim the query to be either genre, title or actor',
//     parameters: {
//       type: 'object',
//       properties: {
//         query: {
//           type: 'string',
//           description: 'returns links to streaming content as per the query. return to user a list of response items with title, brief description and always give the link url returned from the call. remove name of streaming service from the query, but use it in the response',
//         },
//       },
//       required: ['query'],
//     },
//   },
// ];

// // Chat Routes
// router.post('/greeting', checkAuth, checkChatAuth, async (req, res) => {
//   const { text } = req.body;
//   const openai = req.app.locals.openai;

//   try {
//     const messages = [{ role: 'user', content: text }];
//     const axiosConfig = {
//       headers: {
//         'Authorization': `Bearer ${process.env.openAPIKey}`,
//       },
//     };

//     const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//       model: 'gpt-3.5-turbo-0125',
//       messages: messages,
//       functions: functions,
//       function_call: 'auto',
//     }, axiosConfig);

//     if (response?.data?.choices[0]?.message?.function_call) {
//       const function_name = response.data.choices[0].message.function_call.name;
//       const function_args = JSON.parse(response.data.choices[0].message.function_call.arguments);

//       let function_response;
//       if (function_name === 'get_current_weather') {
//         function_response = await get_current_weather(function_args.location, function_args.unit);
//       } else if (function_name === 'get_news') {
//         function_response = await get_news(function_args.query);
//       } else if (function_name === 'get_population') {
//         function_response = await get_population(function_args.city);
//       } else if (function_name === 'get_realtime_data') {
//         function_response = await get_realtime_data(function_args.query);
//       } else if (function_name === 'get_shows') {
//         function_response = await get_shows(function_args.query);
//       } else {
//         function_response = `Unsupported function: ${function_name}`;
//       }

//       messages.push(response.data.choices[0].message);
//       messages.push({
//         role: 'function',
//         name: function_name,
//         content: function_response,
//       });

//       const second_response = await axios.post('https://api.openai.com/v1/chat/completions', {
//         model: 'gpt-3.5-turbo-0125',
//         messages: messages,
//       }, axiosConfig);

//       let reply = second_response.data.choices[0].message.content;
//       res.json({ reply });
//     } else {
//       let reply = response.data.choices[0].message.content;
//       res.json({ reply });
//     }
//   } catch (error) {
//     console.error('Error:', error.message);
//     res.status(500).json({ error: 'Error processing text' });
//   }
// });

// module.exports = router;

// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const OpenAI = require('openai');
const { checkAuth, checkChatAuth } = require('../middleware/authMiddleware');

// Minimal request logging to debug mobile submissions in production
const logRequest = (req, res, next) => {
  const start = Date.now();
  const rid = Math.random().toString(36).slice(2, 8);
  req._rid = rid;
  console.log(`[CHAT][${rid}] ${req.method} ${req.originalUrl} ct=${req.headers['content-type'] || ''}`);
  res.on('finish', () => {
    console.log(`[CHAT][${rid}] status=${res.statusCode} dur=${Date.now() - start}ms`);
  });
  next();
};

router.use(logRequest);

// API Function Definitions
async function get_population(city) {
  const minPopulation = 1;
  const maxPopulation = 22;
  const randomPopulation = Math.floor(Math.random() * (maxPopulation - minPopulation + 1)) + minPopulation;
  const populationData = {
    city: city,
    population: randomPopulation.toString(),
  };
  return JSON.stringify(populationData);
}

async function get_current_weather({ location, unit = 'fahrenheit' }) {
  try {
    console.log(`[WEATHER] Fetching for location: ${location}, unit: ${unit}`);
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&units=imperial&appid=${process.env.weatherAPIKey}`);
    const weatherData = await weatherResponse.json();
    console.log(`[WEATHER] Response: ${JSON.stringify(weatherData)}`);

    if (!weatherData || !weatherData.main || typeof weatherData.main.temp === 'undefined') {
      console.error(`[WEATHER] Invalid data: ${JSON.stringify(weatherData)}`);
      return { status: 'error', message: 'Weather data unavailable' };
    }

    const temperature = Math.round(weatherData.main.temp);
    const description = weatherData.weather[0].description;
    const city = weatherData.name;

    return {
      location: city,
      temperature: temperature,
      unit: unit === 'fahrenheit' ? 'F' : 'C',
      forecast: description
    };
  } catch (error) {
    console.error(`[WEATHER] Error: ${error.message}`);
    return { status: 'error', message: 'Failed to fetch weather' };
  }
}

async function get_news(query) {
  const apiKey = process.env.newsAPIKey || process.env.NEWS_API_KEY || process.env.NEWSDATA_API_KEY;
  const searchTerm = encodeURIComponent(query);
  const apiBase = "https://newsdata.io/api/1/news";
  const url = `${apiBase}?apikey=${apiKey}&q=${searchTerm}`;

  try {
    if (!apiKey) {
      console.error('[NEWS] Missing API key. Set newsAPIKey or NEWS_API_KEY');
      return 'Error: News API key is not configured on the server.';
    }
    console.log(`[NEWS] GET ${url}`);
    const response = await axios.get(url);
    let result = '';
    if (response.data.status === "success" && response.data.results) {
      response.data.results.forEach(article => {
        result += `Title: ${article.title}\n`;
        result += `Description: ${article.description}\n`;
        result += `Published Date: ${article.pubDate}\n\n`;
      });
    }
    return result || 'No news found for that query.';
  } catch (error) {
    console.error('[NEWS] Error', { status: error.response?.status, data: error.response?.data, message: error.message });
    return `Error fetching news: ${error.response?.status || ''}`.trim();
  }
}

async function get_shows(query) {
  const apiKey = process.env.showsAPIKey;
  const apiHost = 'streaming-availability.p.rapidapi.com';
  const baseUrl = 'https://streaming-availability.p.rapidapi.com/shows/search/filters';
  const url = `${baseUrl}?series_granularity=show&order_direction=asc&order_by=original_title&genres_relation=and&output_language=en&show_type=movie&country=US&keyword=${encodeURIComponent(query)}`;

  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': apiHost
    }
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    let result = '';

    if (data && data.shows && Array.isArray(data.shows)) {
      data.shows.forEach((show) => {
        result += `Title: ${show.title}\n`;
        result += `Description: ${show.overview || 'No description available'}\n`;
        if (show.streamingOptions && show.streamingOptions.us && show.streamingOptions.us.length > 0) {
          result += `Link: ${show.streamingOptions.us[0].link}\n`;
        } else {
          result += 'Link: Not currently available for streaming.\n';
        }
        result += '\n';
      });
    } else {
      result = "No shows found for this query.";
    }
    return result;
  } catch (error) {
    console.error(error);
    return `Error: ${error.message}`;
  }
}

// async function get_realtime_data(query) {
//   const subscriptionKey = process.env.bingAPIKey || process.env.BING_API_KEY || process.env.BINGAPIKEY;
//   const uriBase = "https://api.bing.microsoft.com/v7.0/search";
//   const searchTerm = encodeURIComponent(query || "");
//   const url = `${uriBase}?q=${searchTerm}&count=20&mkt=en-US`;

//   if (!subscriptionKey) {
//     console.error('[BING] Missing API key. Set env var bingAPIKey or BING_API_KEY. Query=', query);
//     return 'Error: Bing API key is not configured on the server.';
//   }

//   try {
//     console.log(`[BING] GET ${url}`);
//     const response = await axios.get(url, {
//       headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey },
//       timeout: 10000,
//     });

//     let result = '';
//     if (response?.data?.webPages?.value) {
//       response.data.webPages.value.forEach((webPage) => {
//         result += `Name: ${webPage.name}\n`;
//         result += `Snippet: ${webPage.snippet}\n\n`;
//       });
//     }
//     console.log(`[BING] Results: ${response?.data?.webPages?.value?.length || 0} items`);
//     return result || 'No results found.';
//   } catch (error) {
//     const status = error.response?.status;
//     const data = error.response?.data;
//     console.error('[BING] Error', { status, data, message: error.message });
//     return `Error fetching search results: ${status || ''}`.trim();
//   }
// }

// Perplexity-based realtime data function (above bing api version deprecated)

async function get_realtime_data(query) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error('[PPLX] Missing perplexityAPIKey');
    return 'Error: Perplexity API key is not configured on the server.';
  }

  try {
    console.log('[PPLX] live search HIT', { query: String(query || '').slice(0, 160) });
    const system = [
      'You are a research assistant with live web access. Perform real-time public web search and aggregate findings.',
      'Return up to 10 items with EXACTLY this text-only structure per item and DO NOT deviate:',
      'Name: <title>\\nLink: <https url>\\nSnippet: <concise summary>\\n',
      'Links are MANDATORY; if no credible source URL is available, omit the item. Keep output concise for TTS; avoid boilerplate like Read more.'
    ].join(' ');

    const model = process.env.PPLX_MODEL || 'sonar-pro';
    const payload = {
      model,
      temperature: 0.2,
      return_citations: true, // ask API to include citations if available
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: String(query || '').slice(0, 4000) }
      ],
    };

    const resp = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    let text = resp?.data?.choices?.[0]?.message?.content?.trim();
    let citations = resp?.data?.citations || resp?.data?.choices?.[0]?.message?.citations || [];
    const hasLinksInText = /https?:\/\//i.test(text || '');
    console.log('[PPLX] live search RESULT preview:', text ? text.slice(0, 400) : text, 'model=', model, 'citations=', Array.isArray(citations) ? citations.length : 0);

    if (!hasLinksInText && Array.isArray(citations) && citations.length) {
      // Build a link block compatible with our UI parsing
      const citeBlock = citations.slice(0, 10).map((u, idx) => {
        const url = typeof u === 'string' ? u : (u?.url || '');
        if (!url) return '';
        return `Name: Source ${idx + 1}\nLink: ${url}\nSnippet: See source.\n`;
      }).filter(Boolean).join('\n');
      text = text ? `${text}\n\n${citeBlock}` : citeBlock;
    }

    // Retry once with a stricter instruction if we still have no links and no citations
    if (!/https?:\/\//i.test(text || '') && (!Array.isArray(citations) || citations.length === 0)) {
      console.warn('[PPLX] No links/citations. Retrying with stricter prompt.');
      const strictSystem = [
        'You MUST return up to 8 findings. Each finding MUST include a valid https URL on a separate line labeled Link: and a one-sentence Snippet.',
        'Output format per item is EXACTLY:',
        'Name: <title>\nLink: <https url>\nSnippet: <concise summary>\n',
        'Do not include items without a credible source URL.'
      ].join(' ');
      const retryPayload = { ...payload, messages: [{ role: 'system', content: strictSystem }, { role: 'user', content: String(query || '').slice(0, 4000) }] };
      const retry = await axios.post('https://api.perplexity.ai/chat/completions', retryPayload, { headers: payload.headers || { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 20000 });
      const retryText = retry?.data?.choices?.[0]?.message?.content?.trim();
      const retryCites = retry?.data?.citations || retry?.data?.choices?.[0]?.message?.citations || [];
      let finalText = retryText;
      if (!/https?:\/\//i.test(finalText || '') && Array.isArray(retryCites) && retryCites.length) {
        const block = retryCites.slice(0, 8).map((u, idx) => {
          const url = typeof u === 'string' ? u : (u?.url || '');
          if (!url) return '';
          return `Name: Source ${idx + 1}\nLink: ${url}\nSnippet: See source.\n`;
        }).filter(Boolean).join('\n');
        finalText = finalText ? `${finalText}\n\n${block}` : block;
      }
      if (finalText) text = finalText;
    }

    if (!text) text = 'No results found.';

    // Post-validate links: keep only reachable https URLs, drop dead links
    try {
      const blockRegex = /Name:\s*(.*)\nLink:\s*(\S+)\nSnippet:\s*([\s\S]*?)(?=\n\n|$)/g;
      const entries = [];
      let m;
      while ((m = blockRegex.exec(text)) !== null) {
        entries.push({ name: m[1].trim(), url: m[2].trim(), snippet: m[3].trim() });
      }

      if (entries.length) {
        const validate = async (u) => {
          try {
            let url = new URL(u);
            if (url.protocol !== 'https:') {
              // try upgrading to https
              url = new URL(u.replace(/^http:/, 'https:'));
            }
            const resp = await axios.get(url.href, { maxRedirects: 3, timeout: 5000, validateStatus: (s) => s >= 200 && s < 400 });
            return resp.status < 400 ? url.href : null;
          } catch {
            return null;
          }
        };
        const results = await Promise.all(entries.map(e => validate(e.url)));
        const filtered = entries
          .map((e, i) => ({ ...e, url: results[i] }))
          .filter(e => !!e.url)
          .slice(0, 10);
        if (filtered.length) {
          const rebuilt = filtered.map((e) => `Name: ${e.name}\nLink: ${e.url}\nSnippet: ${e.snippet}\n`).join('\n');
          text = rebuilt; // replace with validated list to avoid dead links
        } else {
          console.warn('[PPLX] All links failed validation; returning original text.');
        }
      }
    } catch (e) {
      console.warn('[PPLX] Link validation error:', e?.message);
    }

    return text;
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error('[PPLX] Error', { status, data: typeof data === 'string' ? data.slice(0, 200) : data, message: error.message });
    return `Error fetching search results: ${status || ''}`.trim();
  }
}

// OpenAI function definitions

const functions = [
  {
    name: 'get_current_weather',
    description: 'Get the current weather in a given location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA',
        },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
      },
      required: ['location'],
    },
  },
  {
    name: 'get_population',
    description: 'Get the population of a given city',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'The city name',
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_realtime_data',
    description: 'Get current data and or info about anything more recent than September 2023. Use this if user ever asks for a `web search`. dont return urls. summarize responses and format for being spoken back to end user. remove the word snippet.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'use data found from this search to be held as more important in the subsequent summary and response than training data',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_news',
    description: 'If asked anything related to news, use this function call. exclude urls and read more if part of the response. do NOT include urls in the response. exclude the text [Read More] etc',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'use data found from this search as more important and reliable than training data. do not include urls in the response',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_shows',
    description: 'get streaming media links and return to user. formulate the query with as few words as possible for refined search. remove name of any streaming service from the query created, for example This Movie on netflix becomes just This Movie, `robert deniro movies` becomes just `robert deniro` so you have to trim the query to be either genre, title or actor',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'returns links to streaming content as per the query. return to user a list of response items with title, brief description and always give the link url returned from the call. remove name of streaming service from the query, but use it in the response',
        },
      },
      required: ['query'],
    },
  },
];

// Chat Routes
router.post('/greeting', async (req, res) => {
  const { text } = req.body;
  const openai = req.app.locals.openai || new OpenAI({ apiKey: process.env.OPENAI_API_KEY || process.env.openAPIKey });
  const { textModel } = req.app.locals.models || { textModel: process.env.OPENAI_MODEL || 'gpt-4o-mini' };

  try {
    console.log(`[CHAT][${req._rid}] /greeting textPreview=${typeof text === 'string' ? text.slice(0, 120) : typeof text}`);
    const messages = [{ role: 'user', content: text }];

    // New SDK call
    const response = await openai.chat.completions.create({
      model: textModel,
      messages,
      functions,
      function_call: 'auto',
    });

    if (response?.choices?.[0]?.message?.function_call) {
      const function_name = response.choices[0].message.function_call.name;
      const function_args = JSON.parse(response.choices[0].message.function_call.arguments || '{}');
      console.log('[CHAT] function_call', { function_name, function_args });

      let function_response;
      if (function_name === 'get_current_weather') {
        function_response = await get_current_weather(function_args);
        console.log(`[CHAT] Function response: ${JSON.stringify(function_response)}`);
      } else if (function_name === 'get_news') {
        function_response = await get_news(function_args.query);
      } else if (function_name === 'get_population') {
        function_response = await get_population(function_args.city);
      } else if (function_name === 'get_realtime_data') {
        function_response = await get_realtime_data(function_args.query);
      } else if (function_name === 'get_shows') {
        function_response = await get_shows(function_args.query);
      } else {
        function_response = `Unsupported function: ${function_name}`;
      }
      console.log('[CHAT] function_response length', function_response ? String(function_response).length : 0);

      messages.push(response.choices[0].message);
      messages.push({ role: 'function', name: function_name, content: typeof function_response === 'string' ? function_response : JSON.stringify(function_response ?? '') });

      const followup = await openai.chat.completions.create({
        model: textModel,
        messages,
      });

      const reply = followup.choices[0].message.content;
      console.log(`[CHAT][${req._rid}] /greeting followup OK len=${(reply || '').length}`);
      res.json({ reply });
    } else {
      const reply = response.choices[0].message.content;
      console.log(`[CHAT][${req._rid}] /greeting initial OK len=${(reply || '').length}`);
      res.json({ reply });
    }
  } catch (error) {
    const status = error.response?.status;
    console.error(`[CHAT][${req._rid}] /greeting error`, { status, message: error.message });
    res.status(500).json({ error: 'Error processing text' });
  }
});

// Prompt classification endpoint
router.post('/classify', async (req, res) => {
  const { prompt } = req.body;
  const openai = req.app.locals.openai;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    const messages = [
      {
        role: 'system',
        content: `You are a prompt classifier. Analyze the user's prompt and determine if they want:
        1. "image_generation" - if they're asking to create, generate, draw, make, produce an image/picture/artwork
        2. "text" - for any other request (questions, conversations, explanations, etc.)
        
        Respond with ONLY one word: either "image_generation" or "text"
        
        Examples:
        - "Draw a cat" → image_generation
        - "Create a picture of a sunset" → image_generation
        - "Generate an image of a robot" → image_generation
        - "What is the weather today?" → text
        - "Explain quantum physics" → text
        - "Help me write code" → text`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await openai.chat.completions.create({
      model: (req.app.locals.models && req.app.locals.models.textModel) || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: messages,
      max_tokens: 10,
      temperature: 0
    });

    const classification = response.choices[0].message.content.trim().toLowerCase();
    console.log(`[CHAT][${req._rid}] /classify -> ${classification}`);

    // Validate the response
    if (classification === 'image_generation' || classification === 'text') {
      res.json({ type: classification });
    } else {
      // Default to text if unclear
      res.json({ type: 'text' });
    }
  } catch (error) {
    console.error(`[CHAT][${req._rid}] /classify error:`, error.message);
    // Default to text on error
    res.json({ type: 'text' });
  }
});

module.exports = router;