/**
 * Resolve API keys with legacy DigitalOcean / pre-refactor env var names.
 * Prefer new names when both are set.
 */
function firstEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return null;
}

function hasEnv(...names) {
  return firstEnv(...names) != null;
}

function getOpenAIApiKey() {
  return firstEnv('OPENAI_API_KEY', 'openAPIKey');
}

function getAnthropicApiKey() {
  return firstEnv('ANTHROPIC_API_KEY');
}

function getXaiApiKey() {
  return firstEnv('XAI_API_KEY');
}

function getGroqApiKey() {
  return firstEnv('GROQ_API_KEY');
}

function getPerplexityApiKey() {
  return firstEnv('PERPLEXITY_API_KEY', 'perplexityAPIKey', 'searchAPIKey');
}

function getBraveApiKey() {
  return firstEnv('BRAVE_API_KEY', 'braveAPIKey');
}

function getBingApiKey() {
  return firstEnv('bingAPIKey', 'BING_API_KEY', 'BINGAPIKEY');
}

function getWeatherApiKey() {
  return firstEnv('weatherAPIKey', 'WEATHER_API_KEY');
}

function getNewsApiKey() {
  return firstEnv('newsAPIKey', 'NEWS_API_KEY', 'NEWSDATA_API_KEY');
}

function getShowsApiKey() {
  return firstEnv('showsAPIKey', 'SHOWS_API_KEY');
}

function getAuthCode() {
  return firstEnv('theCode', 'THE_CODE', 'API_CODE');
}

module.exports = {
  firstEnv,
  hasEnv,
  getOpenAIApiKey,
  getAnthropicApiKey,
  getXaiApiKey,
  getGroqApiKey,
  getPerplexityApiKey,
  getBraveApiKey,
  getBingApiKey,
  getWeatherApiKey,
  getNewsApiKey,
  getShowsApiKey,
  getAuthCode,
};
