# Project Felys — website

The Felys-language playground: a three-surface Next.js 16 app (App Router, React 19, TypeScript strict, Tailwind v4).

| Surface | Route | What it does |
| --- | --- | --- |
| Compiler | `/[locale]/compiler` | Monaco editor for `felys`, compiled and executed in Web Workers via a `wasm-pack` build of the `felys` crate |
| Chat | `/[locale]/chat` | Streamed chat against a self-hosted LLM checkpoint, with per-line perplexity shown as text opacity |
| Voice | `/[locale]/voice` | Streamed text-to-speech over WebSocket, with a seekable waveform and WAV export |

Locales are `en` and `zh`; `/` redirects based on `Accept-Language`.

## Getting started

```bash
npm install

# The app imports @/wasm/pkg, which is generated and gitignored, so this must run
# before `dev` or `build`:
rustup target add wasm32-unknown-unknown   # one-time
cargo install wasm-pack                    # one-time
wasm-pack build ./wasm --target web

npm run dev
```

## Commands

```bash
npm run dev      # needs the WASM artifact built first
npm run build    # production build; also acts as the typecheck
npm run lint     # eslint flat config (eslint.config.mjs)
```

There is no `test` script yet. **`next build` no longer runs ESLint as of Next.js 16**, so run `npm run lint` explicitly — CI currently does not.

## Configuration

External services are declared as constants in `lib/config/endpoints.ts`:

- `CHAT_COMPLETIONS_URL` — `https://llm.felys.dev/v1/chat/completions`
- `BACKEND_HEALTH_URL` — `https://llm.felys.dev/health`
- `TTS_SOCKET_URL` — `wss://tts.felys.dev/v1/audio/speech/stream`
- `TTS_HEALTH_URL` — `https://tts.felys.dev/health`
- `BOOK_URL` — `https://book.felys.dev`

UI copy and route names live under `lib/config/{en,zh}/`, registered in `lib/config/locales.ts`.

## Layout

```
app/[locale]/        compiler | chat | voice surfaces, plus the home page
components/          presentational UI shared by 2+ surfaces (navigator, background, icons)
lib/compiler/        Monaco setup, sample codebase, worker orchestration, wasm workers
lib/chat/            chat request/SSE parsing, session + typewriter + health hooks
lib/voice/           PCM buffer/player engine, TTS transport, waveform, wav encoding
lib/config/          locale registry, ConfigProvider context, per-locale copy, endpoints
wasm/                Rust crate compiled to wasm (generated output in wasm/pkg/)
```

Agent-facing notes — build prerequisites, conventions that differ from Next.js defaults, and the rules for adding a locale — live in `AGENTS.md`.

## Deployment

Pushes to `main` deploy to Vercel via `.github/workflows/main.yml` (install Rust + wasm-pack → `npm ci` → build WASM → `vercel build --prod` → deploy). Deploys are automatic; do not run `vercel` locally.
