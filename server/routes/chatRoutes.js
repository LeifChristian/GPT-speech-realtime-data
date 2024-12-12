// // routes/chatRoutes.js
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
const { checkAuth, checkChatAuth } = require('../middleware/authMiddleware');

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

async function get_current_weather(location, unit = 'imperial') {
  const apiKey = process.env.weatherAPIKey;
  try {
    const response = await axios.get(`http://api.weatherstack.com/current`, {
      params: {
        access_key: apiKey,
        query: location,
        units: unit === 'imperial' ? 'f' : 'm',
      },
    });
    const weatherData = response.data;
    const temperature = weatherData.current.temperature;
    const locationName = weatherData.location.name;
    return `Current temperature in ${locationName} is ${temperature} ${unit === 'imperial' ? 'F' : 'C'}`;
  } catch (error) {
    console.error('Error getting weather:', error);
    throw new Error('Failed to get the current weather');
  }
}

async function get_news(query) {
  const apiKey = process.env.newsAPIKey;
  const searchTerm = encodeURIComponent(query);
  const apiBase = "https://newsdata.io/api/1/news";
  const url = `${apiBase}?apikey=${apiKey}&q=${searchTerm}`;

  try {
    const response = await axios.get(url);
    let result = '';
    if (response.data.status === "success" && response.data.results) {
      response.data.results.forEach(article => {
        result += `Title: ${article.title}\n`;
        result += `Description: ${article.description}\n`;
        result += `Published Date: ${article.pubDate}\n\n`;
      });
    }
    return result;
  } catch (error) {
    console.log(error);
    return null;
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

async function get_realtime_data(query) {
  const subscriptionKey = process.env.bingAPIKey;
  const uriBase = "https://api.bing.microsoft.com/v7.0/search";
  const searchTerm = encodeURIComponent(query);
  const url = `${uriBase}?q=${searchTerm}&count=20&mkt=en-US`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey
      }
    });

    let result = '';
    if (response.data.webPages && response.data.webPages.value) {
      response.data.webPages.value.forEach(webPage => {
        result += `Name: ${webPage.name}\n`;
        result += `Snippet: ${webPage.snippet}\n\n`;
      });
    }
    return result;
  } catch (error) {
    console.log(error);
    return null;
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
  const { text, code } = req.body;
  const openai = req.app.locals.openai;

  try {
    const messages = [{ role: 'user', content: text }];
    const axiosConfig = {
      headers: {
        'Authorization': `Bearer ${process.env.openAPIKey}`,
      },
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo-0125',
      messages: messages,
      functions: functions,
      function_call: 'auto',
    }, axiosConfig);

    if (response?.data?.choices[0]?.message?.function_call) {
      const function_name = response.data.choices[0].message.function_call.name;
      const function_args = JSON.parse(response.data.choices[0].message.function_call.arguments);

      let function_response;
      if (function_name === 'get_current_weather') {
        function_response = await get_current_weather(function_args.location, function_args.unit);
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

      messages.push(response.data.choices[0].message);
      messages.push({
        role: 'function',
        name: function_name,
        content: function_response,
      });

      const second_response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo-0125',
        messages: messages,
      }, axiosConfig);

      let reply = second_response.data.choices[0].message.content;
      res.json({ reply });
    } else {
      let reply = response.data.choices[0].message.content;
      res.json({ reply });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Error processing text' });
  }
});

module.exports = router;