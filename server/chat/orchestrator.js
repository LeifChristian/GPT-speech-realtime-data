const { TOOL_DEFINITIONS } = require('../tools/definitions');
const { executeTool } = require('../tools');
const { buildSystemPrompt, getPersonalityTemperature } = require('../config/personalities');
const { complete, completeSimple } = require('../providers');
const {
  isWeatherQuery,
  extractWeatherLocation,
  isUsableToolResult,
  getLatestUserTurn,
} = require('../utils/intent');

const MAX_TOOL_ROUNDS = 3;

async function prefetchWeatherContext(userMessage, searchProvider) {
  if (!isWeatherQuery(userMessage)) return userMessage;

  const latest = getLatestUserTurn(userMessage);
  const location = extractWeatherLocation(userMessage);
  let toolResult;

  if (location) {
    console.log('[ORCH] prefetch weather', { location, searchProvider });
    toolResult = await executeTool('get_current_weather', { location }, { searchProvider });
  } else {
    console.log('[ORCH] prefetch weather via search query', { latest, searchProvider });
    toolResult = await executeTool('get_realtime_data', { query: latest }, { searchProvider });
  }

  if (!isUsableToolResult(toolResult)) {
    console.log('[ORCH] prefetch weather failed', {
      preview: String(toolResult).slice(0, 120),
    });
    return userMessage;
  }

  return `${userMessage}\n\n[WEATHER_TOOL_RESULT]\n${toolResult}\n[/WEATHER_TOOL_RESULT]\nSummarize the weather data above for the user.`;
}

async function runChatWithTools({
  provider,
  model,
  userMessage,
  personalityId,
  searchProvider,
  maxRounds = MAX_TOOL_ROUNDS,
}) {
  const weatherQuery = isWeatherQuery(userMessage);
  const system = buildSystemPrompt(personalityId, { weatherQuery });
  const temperature = getPersonalityTemperature(personalityId);
  const enrichedMessage = await prefetchWeatherContext(userMessage, searchProvider);
  const messages = [{ role: 'user', content: enrichedMessage }];
  const toolContext = { searchProvider };

  for (let round = 0; round < maxRounds; round += 1) {
    const result = await complete({
      provider,
      model,
      messages,
      system,
      tools: TOOL_DEFINITIONS,
      temperature,
    });

    if (!result.toolCalls?.length) {
      return result.text || '';
    }

    messages.push(result.assistantMessage);

    for (const toolCall of result.toolCalls) {
      console.log('[ORCH] tool_call', { name: toolCall.name, round, searchProvider });
      const toolResult = await executeTool(toolCall.name, toolCall.arguments, toolContext);
      messages.push({
        role: 'tool',
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        content: toolResult,
      });
    }
  }

  const final = await completeSimple({
    provider,
    model,
    messages,
    system,
    temperature,
  });
  return final.text || '';
}

async function runSimpleChat({
  provider,
  model,
  userMessage,
  system,
  temperature,
  maxTokens,
}) {
  const result = await completeSimple({
    provider,
    model,
    messages: [{ role: 'user', content: userMessage }],
    system,
    temperature,
    maxTokens,
  });
  return result.text || '';
}

module.exports = {
  runChatWithTools,
  runSimpleChat,
  MAX_TOOL_ROUNDS,
};
