# Omnibot (GPT Speech Realtime Data)

**Version:** 1.1

Voice-first AI assistant with multi-provider chat, tool calling, image generation, and realtime web search. Built for SOS Technologies community response workflows — fast to deploy, configurable at runtime, and designed to keep sensitive credentials on the server.

**Production deploy branch:** `frontend-ui-x1` (DigitalOcean App Platform)

### Versioning

Release versions use **major.minor** only (e.g. `1.1`, `1.2`). Bump `version` in root `package.json` — the UI, `GET /version`, and server config all read from there.

---

## Features

- **Multi-provider chat** — OpenAI, Anthropic, xAI (Grok), and Groq via a shared orchestrator and provider adapters
- **GPT-5 support** — GPT-5 family routes through the OpenAI Responses API; GPT-4.x uses Chat Completions
- **Voice mode** — Continuous turn-based voice on desktop (Web Speech API STT + TTS), mic visualizer, FFwd to skip speech, 3-minute inactivity timeout; main text input hides while voice mode is active
- **Mobile voice** — Whisper API path for STT on narrow viewports; same UI, different capture pipeline
- **Personality presets** — Default, Direct, Creative, Analyst, Comedian (runtime-selectable system prompts)
- **Realtime tools** — Weather, news, web search (Brave or Perplexity), streaming availability
- **Image generation** — GPT Image models via OpenAI
- **Vision** — Upload or camera capture for image analysis
- **Conversations** — LocalStorage persistence, export, auto-named new chats
- **Settings panel** — Model, personality, and search provider selection without redeploy

---

## Architecture

```
React (port 3000 dev)          Express API (port 3001 / PORT in prod)
        |                                |
        +-------- /models, /chat --------+
        +-------- /image, /audio --------+
        +-------- /file -----------------+

server/
  chat/orchestrator.js     Unified tool loop (max 3 rounds)
  tools/                   Provider-agnostic JSON schemas + executors
  providers/               OpenAI, Anthropic, xAI, Groq adapters
  config/models.js         Runtime catalog + defaults
  config/personalities.js  System prompt presets
  config/search.js         Brave / Perplexity toggle
  routes/                  HTTP endpoints
```

In **production**, a single Express process serves the API and the React `build/` static bundle (`NODE_ENV=production`).

---

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `frontend-ui-x1` | **Production** — DigitalOcean watches this branch |
| `beta` | Multi-provider harness experiments; merge into x1 when stable |
| `main` | Mirror of production after PR merges |
| `frontend-overhaul` | Legacy; not used for DO deploy |

Pushes to `main` alone do **not** deploy. Always push production changes to `frontend-ui-x1`.

---

## Prerequisites

- Node.js 20.x
- [pnpm](https://pnpm.io/) 9.x (recommended)
- API keys (see Environment below)

---

## Quick start

```bash
git clone https://github.com/LeifChristian/GPT-speech-realtime-data.git
cd GPT-speech-realtime-data
cp .env.example .env
# Edit .env — at minimum set OPENAI_API_KEY, theCode, REACT_APP_API_KEY

pnpm install
cd server && pnpm install && cd ..

pnpm dev
```

- **Frontend:** http://localhost:3000
- **API (dev):** http://localhost:3001

`pnpm dev` runs the React dev server and the Express API concurrently. The dev proxy in `src/setupProxy.js` forwards API routes to port 3001.

---

## Environment

Copy `.env.example` to `.env` at the repo root. For local dev, one root `.env` is enough. Copy to `server/.env` only if you run the server from `server/` directly.

### Required

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Chat, vision, image generation, mobile Whisper STT |
| `theCode` | Shared secret for `/file` save and export |
| `REACT_APP_API_KEY` | Same value as `theCode` (sent from frontend) |

### Optional — enable extra providers

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude models |
| `XAI_API_KEY` | Grok models |
| `GROQ_API_KEY` | Llama / Mixtral via Groq |

Providers without keys are omitted from the Settings catalog automatically.

### Optional — model defaults (server startup)

| Variable | Default |
|----------|---------|
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `OPENAI_VISION_MODEL` | `gpt-4o` |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1` |
| `DEFAULT_PERSONALITY` | `default` |
| `SEARCH_PROVIDER` | `brave` (falls back to `perplexity` if Brave key missing) |

Settings panel changes are in-memory until restart unless persisted via env on redeploy.

### Optional — tools and search

| Variable | Tool |
|----------|------|
| `BRAVE_API_KEY` | Web search (recommended) |
| `PERPLEXITY_API_KEY` | Web search (AI-summarized) |
| `weatherAPIKey` | Current weather |
| `newsAPIKey` / `NEWS_API_KEY` | News headlines |
| `showsAPIKey` | Streaming availability |

### Optional — frontend gate

| Variable | Purpose |
|----------|---------|
| `REACT_APP_PASSWORD` | Numeric password on first load |
| `REACT_APP_API_BASE_URL` | API origin when frontend and backend are on different hosts |

Never commit `.env` or paste keys into the repo. Rotate any key that was exposed in chat or logs.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | React (3000) + API (3001) with hot reload |
| `pnpm start` | React dev server only |
| `pnpm run server` | Express API only (nodemon) |
| `pnpm run build` | Production React build → `build/` |
| `cd server && pnpm start` | Run API (`node server.js`) |

---

## Production (DigitalOcean)

Typical App Platform configuration:

1. **Source branch:** `frontend-ui-x1`
2. **Build command:** `pnpm install && pnpm run build && cd server && pnpm install`
3. **Run command:** `cd server && NODE_ENV=production node server.js`
4. **HTTP port:** `PORT` (injected by DO — do not hardcode in `.env`)

Set environment variables in the DO dashboard (same names as `.env.example`). After code changes, trigger a **git deploy** — config-only redeploys may not pull the latest commit. If Activity shows "Updated app configuration" without a new GitHub commit, push to `frontend-ui-x1` or use **Actions → Deploy** to force a code build.

Verify deploy:

```bash
curl -s https://your-app.ondigitalocean.app/version | jq .
curl -s https://your-app.ondigitalocean.app/models | jq '.available.text[].model'
curl -s -X POST https://your-app.ondigitalocean.app/chat/greeting \
  -H 'Content-Type: application/json' \
  -d '{"text":"ping","personality":"default"}' | jq '.reply'
```

Expect version `1.1`, `gpt-5`, `gpt-5-mini`, and `gpt-5-nano` in `/models` when running current `frontend-ui-x1`. Chat requests accept an optional `personality` field (e.g. `default`, `concise`, `comedian`).

---

## API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/version` | GET | App release version (major.minor) |
| `/models` | GET | Active runtime config + available catalog |
| `/models` | POST | Update text/vision/image model, personality, search provider |
| `/chat/greeting` | POST | Main chat completion with tool loop |
| `/chat/classify` | POST | Detect text vs image intent |
| `/image/generate` | POST | GPT Image generation |
| `/image/analyze` | POST | Vision analysis |
| `/audio/transcribe` | POST | Whisper STT (mobile path) |
| `/file/save` | POST | Save conversation (requires API key) |
| `/file/export` | POST | Export conversation (requires API key) |

---

## Model catalog (high level)

**Chat:** GPT-4o family, GPT-4.1, GPT-5 family (Responses API), Claude, Grok, Groq open models

**Vision:** GPT-4o, Claude Sonnet 4, Grok 2 Vision

**Image:** GPT Image 1 / 1 Mini / 1.5 (OpenAI only)

Select models in the Settings dropdown under the title bar. GPT-5 entries show a `Responses` suffix.

---

## Security notes

- API keys live server-side only; the frontend receives a filtered model catalog
- `/file` routes require `REACT_APP_API_KEY` matching server `theCode`
- Optional `REACT_APP_PASSWORD` adds a client-side gate (not a substitute for auth at scale)
- CORS is open (`*`) — acceptable for a single-tenant deploy; tighten for multi-tenant use
- Do not commit secrets; use DO encrypted env vars in production

---

## Legacy files

These remain for reference and are not used by the current app entry point:

- `src/App-llama.js`, `server-llama.js` — early Groq experiments
- `src/App-og.js` — original GPT-3.5 frontend

Active entry: `src/App.js` + `server/server.js`.

---

## Troubleshooting

**Settings shows only GPT-4 models on prod** — DO may have redeployed config without pulling latest git. Confirm branch is `frontend-ui-x1` and trigger a fresh deploy from GitHub.

**`Route not found` on localhost:3000** — API routes must go through the dev proxy; use `pnpm dev`, not `pnpm start` alone.

**Voice Start hidden on desktop** — Viewport detection may classify as mobile; widen browser or check `src/utils/voiceDevice.js`.

**Brave search fails** — Set `BRAVE_API_KEY` or switch to Perplexity in Settings.

---

## License

Private / internal SOS Technologies project. See repository owner for usage terms.
