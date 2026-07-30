const WEATHER_QUERY_PATTERN =
  /\b(weather|temperature|forecast|how\s+(?:hot|cold|warm|humid)|going to rain|rain(?:ing)? today|sunny|cloudy)\b/i;

const WEATHER_LOCATION_PATTERNS = [
  /\bweather(?:\s+(?:in|for|at|near))?\s+([A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F\s,'.-]{1,48})/i,
  /^([A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F\s,'.-]{1,48})\s+weather\b/i,
  /\b(?:in|for|at|near)\s+([A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F\s,'.-]{1,48})\??\s*$/i,
  /\btemperature(?:\s+(?:in|for|at))?\s+([A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F\s,'.-]{1,48})/i,
];

function getLatestUserTurn(text) {
  const input = String(text || '');
  const quoted = input.match(/"([^"]+)"\s*$/);
  if (quoted?.[1]) return quoted[1].trim();

  const questions = [...input.matchAll(/Question:\s*/g)];
  if (questions.length > 0) {
    const start = questions[questions.length - 1].index + 'Question:'.length;
    const tail = input.slice(start);
    const end = tail.search(/\sResponse:/);
    return (end === -1 ? tail : tail.slice(0, end)).trim();
  }

  return input.trim();
}

function isWeatherQuery(text) {
  return WEATHER_QUERY_PATTERN.test(getLatestUserTurn(text));
}

function extractWeatherLocation(text) {
  const input = getLatestUserTurn(text);
  for (const pattern of WEATHER_LOCATION_PATTERNS) {
    const match = input.match(pattern);
    if (match?.[1]) {
      return match[1]
        .trim()
        .replace(/[?.!,]+$/, '')
        .replace(/\s+(please|right now|today|currently)$/i, '')
        .trim();
    }
  }
  return null;
}

function isUsableToolResult(result) {
  const value = String(result || '').trim();
  if (!value) return false;
  if (/^error/i.test(value)) return false;
  if (/not configured/i.test(value)) return false;
  if (/unable to fetch/i.test(value)) return false;
  return true;
}

module.exports = {
  getLatestUserTurn,
  isWeatherQuery,
  extractWeatherLocation,
  isUsableToolResult,
};
