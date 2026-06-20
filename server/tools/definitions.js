/**
 * Provider-agnostic tool definitions (JSON Schema).
 * Adapters translate these into each vendor's tool format.
 */
const TOOL_DEFINITIONS = [
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
    description:
      'Get current data and or info about anything more recent than September 2023. Use this if user ever asks for a web search. Summarize for spoken delivery; omit the word snippet.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query; treat results as more important than training data in the follow-up answer',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_news',
    description:
      'If asked anything related to news, use this function. Do not include URLs or "Read more" in the final spoken response.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'News search query',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_shows',
    description:
      'Find streaming media. Trim the query to genre, title, or actor only (drop service names like Netflix).',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Short keyword query for streaming availability search',
        },
      },
      required: ['query'],
    },
  },
];

module.exports = { TOOL_DEFINITIONS };
