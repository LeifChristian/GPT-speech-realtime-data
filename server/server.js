const express = require('express');
const fs = require('fs');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const axios = require('axios')
 const apiKey = process.env.openAPIKey

// console.log(process.env, myAPIKey)

const bodyParser = require('body-parser');
const multer = require('multer');

const cors = require('cors');

const OpenAI = require('openai');
const openai = new OpenAI({apiKey: apiKey});

const app = express();
app.use(cors({
  origin: '*', // Allow any origin
  methods: ['GET', 'POST'], 
  allowedHeaders: ['Content-Type'], 
}));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const SerpApi = null
const search = null


async function getSearchResults(query) {
  const params = {
    engine: "duckduckgo",
    q: query,
    kl: "us-en"
  };

  try {
    const response = await search.json(params);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Failed to fetch search results');
  }
}


app.post('/sendImage', upload.single('file'), async (req, res) => {
  const file = req.file;
  const stuff = req.body.stuff;
console.log('sendImage route')
stuff ? console.log(stuff, '<--text prompt') : '';

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const base64Image = file.buffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: stuff || "What is in this image?" },
            {
              type: "image_url",
              image_url: {
                url: `data:image/${file.mimetype.split('/')[1]};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });
    console.log(response.choices[0].message.content, "<--- response")
    res.json({ type: 'text', content: response.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to process the file' });
  }
});

app.post('/upload', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });
    const imageUrl = response.data[0].url;
    res.json({ type: 'image', content: imageUrl });
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

app.post('/greeting', async (req, res) => {
  const { text, code } = req.body;

    if (!code || code !== process.env.theCode) {
    console.log('Unauthorized');
    res.status(401).json({ error: 'Unauthorized' });
    return;
   }

  try {
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
        // description: 'Get current data and or info about anything more recent than September 2023, current events, news, sports, entertainment, world events and stats. dont return urls. summarize responses and format for being spoken back to end user. remove the word snippet. for news summaries, remove entries that just list the name of the orgnization and its description if it doesnt include actual news',
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

    const axiosConfig = {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    };

    const messages = [
      { role: 'user', content: text },
    ];

    // const choices = response?.data?.choices || [];
    // const reply = choices.map(choice => choice.message.content).join('\n');

    // res.json({ reply });

    async function get_population(city) {
      // Dummy implementation

      const minPopulation = 1;
      const maxPopulation = 22;
    
      // Generate a random population between minPopulation and maxPopulation
      const randomPopulation = Math.floor(Math.random() * (maxPopulation - minPopulation + 1)) + minPopulation;
      const populationData = {
          city: city,
          population: randomPopulation.toString(),
      };
      return JSON.stringify(populationData);
  }
  
  async function get_current_weather(location, unit = 'imperial') {
      const apiKey = process.env.weatherAPIKey
    
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

      console.log(query, '<---- the query')
      const apiKey = process.env.newsAPIKey
      const searchTerm = encodeURIComponent(query);
      const apiBase = "https://newsdata.io/api/1/news";
    
      const url = `${apiBase}?apikey=${apiKey}&q=${searchTerm}`;
    
      try {
        const response = await axios.get(url);
    
        let result = '';
    
        if (response.data.status === "success" && response.data.results) {
          response.data.results.forEach(article => {
            result += `Title: ${article.title}\n`;
            result += `Link: ${article.link}\n`;
            result += `Description: ${article.description}\n`;
            result += `Published Date: ${article.pubDate}\n\n`;
          });
        }
    
        console.log(result);
        return result;
    
      } catch (error) {
        console.log(error);
        return null;
      }
    }

    async function get_spotify(query) {
      const apiBase = "https://api.spotify.com/v1/search";
      const searchTerm = encodeURIComponent(query);
      const type = "track"; // We're searching for tracks
      const market = "ES"; // Example market, adjust as needed
      const limit = 1; // We only need the top result
      const url = `${apiBase}?q=${searchTerm}&type=${type}&market=${market}&limit=${limit}`;
    
      // You'll need to replace this with your actual access token
      const accessToken = "YOUR_SPOTIFY_ACCESS_TOKEN";
    
      try {
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
    
        let result = '';
        if (response.data && response.data.tracks && response.data.tracks.items.length > 0) {
          const track = response.data.tracks.items[0];
          result += `Name: ${track.name}\n`;
          result += `Artist: ${track.artists[0].name}\n`;
          result += `Album: ${track.album.name}\n`;
          result += `Spotify URI: ${track.uri}\n\n`;
        } else {
          result = "No tracks found for this query.";
        }
    
        console.log(result);
        return result;
      } catch (error) {
        console.log(error);
        return null;
      }
    }


async function get_shows(query) {
  console.log(query, '<---- the query');
  const apiKey = process.env.showsAPIKey
  const apiHost = 'streaming-availability.p.rapidapi.com';
  const baseUrl = 'https://streaming-availability.p.rapidapi.com/shows/search/filters';

 // Search by filters URL (commented out)
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
      data.shows.forEach((show, index) => {
        result += `Title: ${show.title}\n`;
        result += `Description: ${show.overview || 'No description available'}\n`;
        if (show.streamingOptions && show.streamingOptions.us && show.streamingOptions.us.length > 0) {
          result += `Link: ${show.streamingOptions.us[0].link}\n`;
        } else {
          result += 'Link: Not currently available for streaming.\n';
        }
        result += '\n';  // Add a blank line between shows
      });
    } else {
      result = "No shows found for this query.";
    }

    console.log(result, "Concatenated Result");
    return result;

  } catch (error) {
    console.error(error);
    return `Error: ${error.message}`;
  }
}
async function get_realtime_data(query) {
  const subscriptionKey = process.env.bingAPIKey
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

     console.log(result, "result!!!")   

    return result;

  } catch (error) {
    console.log(error);
    return null;
  }
}

      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          // model: 'gpt-4-1106-preview',
	        //   model: 'gpt-4o',
	      model: 'gpt-3.5-turbo-0125',
          messages: messages,
          functions: functions,
          function_call: 'auto',
           // max_tokens: 60, // Specify the desired length in tokens
          
        }, axiosConfig);
      
        if (response?.data?.choices[0]?.message?.function_call) {
          const function_name = response.data.choices[0].message.function_call.name;
          const function_args = JSON.parse(response.data.choices[0].message.function_call.arguments);
      
          let function_response;
          if (function_name === 'get_current_weather') {
            function_response = await get_current_weather(
              function_args.location,
              function_args.unit
            );}
            if (function_name === 'get_news') {
              function_response = await get_news(
                function_args.query
              );
          } else if (function_name === 'get_population') {
            function_response = await get_population(function_args.city);
          } else if (function_name === 'get_realtime_data') {
            function_response = await get_realtime_data(function_args.query);}
            else if (function_name === 'get_shows') {
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
           // model: 'gpt-4-turbo-preview',
            messages: messages,
          }, axiosConfig);
      
          console.log(second_response.data.choices[0].message.content);
          let reply = second_response.data.choices[0].message.content;
          res.json({ reply });
        } else {
          let reply = response.data.choices[0].message.content;
          res.json({ reply });
          console.log(response.data.choices[0].message.content);
        }}
  
  catch (error) {
      console.error('Error:', error.message);
  }
  } catch (error) {
    console.log('Error processing text:', error);
    res.status(500).json({ error: 'Error processing text' });
  }
});



// const LlamaAI = require('llamaai');
// // Initialize Llama API
// const llamaAPI = new LlamaAI('tokenHere');

app.post('/greetingTwo', async (req, res) => {
  const { text, code } = req.body;

  if (!code || code !== process.env.theCode) {
    console.log('Unauthorized');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const apiRequestJson = {
      model: 'llama-13b-chat',
      messages: [
        { role: 'user', content: text }
      ],
      functions: [
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
          description: 'Get current data and or info about anything more recent than September 2023. dont return urls. summarize responses and format for being spoken back to end user. remove the word snippet.',
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
      ],
      function_call: 'auto',
    };

    const response = await llamaAPI.run(apiRequestJson);

    let reply;
    if (response.choices && response.choices[0] && response.choices[0].message) {
      if (response.choices[0].message.function_call) {
        const functionName = response.choices[0].message.function_call.name;
        const functionArgs = JSON.parse(response.choices[0].message.function_call.arguments);

        let functionResponse;
        if (functionName === 'get_current_weather') {
          functionResponse = await get_current_weather(functionArgs.location, functionArgs.unit);
        } else if (functionName === 'get_population') {
          functionResponse = await get_population(functionArgs.city);
        } else if (functionName === 'get_realtime_data') {
          functionResponse = await get_realtime_data(functionArgs.query);
        } else if (functionName === 'get_news') {
          functionResponse = await get_news(functionArgs.query);
        } else {
          functionResponse = `Unsupported function: ${functionName}`;
        }

        const secondResponse = await llamaAPI.run({
          ...apiRequestJson,
          messages: [
            ...apiRequestJson.messages,
            {
              role: 'function',
              name: functionName,
              content: JSON.stringify(functionResponse),
            },
          ],
        });

        reply = secondResponse.choices[0].message.content;
      } else {
        reply = response.choices[0].message.content;
      }
    } else {
      throw new Error('Unexpected response structure from Llama API');
    }

    res.json({ reply });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
});


async function get_current_weather(location, unit = 'imperial') {
  const apiKey = process.env.weatherAPIKey
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

async function get_population(city) {
  const minPopulation = 1;
  const maxPopulation = 17;
  const randomPopulation = Math.floor(Math.random() * (maxPopulation - minPopulation + 1)) + minPopulation;
  const populationData = {
    city: city,
    population: randomPopulation.toString(),
  };
  return JSON.stringify(populationData);
}

async function get_realtime_data(query) {
  const subscriptionKey = process.env.bingAPIKey
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

async function get_news(query) {
  const apiKey = process.env.newsAPIKey
  const apiBase = "https://newsdata.io/api/1/news";
  const searchTerm = encodeURIComponent(query);
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

app.post('/saveFile', async (req, res) => {
  const { text, content, code } = req.body;
  console.log(text, content, code)

  if(!code.length || code !==process.env.theCode){res.send('unauthorized'); return}

  let fileName;
  const cwd = process.cwd(); 

  if (text.length) {
    fileName = path.join(cwd, `/savedConvos/${text}.txt`);
  } else {
    fileName = path.join(cwd, `/savedConvos/${uuidv4()}.txt`);
  }

  if (fileName.length && content.length) {

 if (fs.existsSync(fileName)){
  fileName = path.join(cwd, `/savedConvos/${uuidv4()}.txt`);
 }

    fs.writeFile(fileName, content, (err) => {
      if (err) throw err;
      console.log('File saved!');
      res.sendStatus(200);
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
