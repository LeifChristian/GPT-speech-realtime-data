const { TOOL_DEFINITIONS } = require('../tools/definitions');
const { executeTool } = require('../tools');
const { buildSystemPrompt } = require('../config/personalities');
const { complete, completeSimple } = require('../providers');

const MAX_TOOL_ROUNDS = 3;

async function runChatWithTools({
  provider,
  model,
  userMessage,
  personalityId,
  searchProvider,
  maxRounds = MAX_TOOL_ROUNDS,
}) {
  const system = buildSystemPrompt(personalityId);
  const messages = [{ role: 'user', content: userMessage }];
  const toolContext = { searchProvider };

  for (let round = 0; round < maxRounds; round += 1) {
    const result = await complete({
      provider,
      model,
      messages,
      system,
      tools: TOOL_DEFINITIONS,
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
