<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Felys website

Next.js 16 app (App Router, React 19, TS strict, Tailwind v4) that hosts a Felys-language playground. Three surfaces live under `app/[locale]/`: `compiler` (Monaco editor + WASM), `chat` (streamed LLM chat), `voice` (streamed TTS playback).

## Build prerequisites — read this first

- `wasm/pkg/` is gitignored (see `wasm/pkg/.gitignore`). The app imports `@/wasm/pkg` in `lib/compiler/workers/compile.ts` and `lib/compiler/workers/execute.ts`, so **you must build the WASM artifact before `next dev` or `next build` will work**:
  ```bash
  rustup target add wasm32-unknown-unknown   # one-time
  cargo install wasm-pack                    # one-time
  wasm-pack build ./wasm --target web
  ```
- The WASM crate (`wasm/Cargo.toml`) depends on the `felys` git crate from `github.com/felys-lang/felys`. Changes to `wasm/src/lib.rs` require a rebuild via the same command.
- Do not edit `wasm/pkg/*` by hand — it is generated.
- Web workers load the `.wasm` via `new URL("@/wasm/pkg/wasm_bg.wasm", import.meta.url)`. Preserve this pattern; Next.js needs it to bundle worker + wasm correctly.

## Commands

```bash
npm install
npm run dev      # needs WASM built first (see above)
npm run build    # production build; also acts as the typecheck
npm run lint     # eslint flat config (eslint.config.mjs)
```

- There is no separate `typecheck` or `test` script. Verify changes with `npm run lint` then `npm run build`.
- Node `>=20.9.0` (CI runs on Node 24).
- CI flow (`.github/workflows/main.yml`): install Rust + wasm-pack → `npm ci` → `wasm-pack build ./wasm --target web` → `vercel build --prod` → deploy. Pushes to `main` deploy automatically; do not run `vercel` locally unless asked.

## Environment

- Every external service is declared as a constant in `lib/config/endpoints.ts` (`llm.felys.dev` for chat + health, `tts.felys.dev` over WebSocket, `book.felys.dev`). They are hit directly from the browser and there are no `/api` route handlers. Import from there rather than writing a host inline in a component or hook.
- `.env.local` is gitignored and holds a Vercel OIDC token; never commit it.
- `next.config.ts` injects `NEXT_PUBLIC_BUILD_DATE` (computed at build time, shown as the "version" in the compiler page). Do not replace it with a static value.

## Conventions that differ from defaults

- **Tailwind v4**, configured via `@import "tailwindcss"` + `@theme` in `app/globals.css`. There is no `tailwind.config.js`. Custom color token `--color-pink` enables the `text-pink` / `bg-pink` utilities used throughout.
- **i18n is hand-rolled**, not next-intl. `lib/config/locales.ts` is the single source of truth: `LOCALES` maps each locale to its config and `LOCALE_LIST` drives `generateStaticParams` in `app/[locale]/layout.tsx`, the `ConfigProvider` context and the language switcher. `resolveLocale` does the `Accept-Language` match used by `app/page.tsx`. **To add a locale**: extend the `Locale` union in `lib/config/types.ts`, add a `lib/config/<locale>/` folder, and add the entry to `LOCALES` — TypeScript enforces the rest, and each config's `root` is checked against its own key.
- Path alias: `@/*` → repo root. Every intra-repo import goes through it (`@/lib/...`, `@/components/...`, `@/wasm/pkg`, `@/public/...`); relative paths are never used — see Naming.
- `app/layout.tsx` returns `children` directly (no wrapping `<html>`/`<body>`); the per-locale `<html>` is emitted by `app/[locale]/layout.tsx`. Keep this split.
- Monaco editor language `felys` and theme `felys-dark` are registered imperatively in `lib/compiler/monaco.ts` (`configureMonaco`), which is consumed by the compiler page. The compiler page keeps only UI; its state and worker logic live in `lib/compiler/useCompiler.ts`. The compiler feature (samples in `lib/compiler/codebase.ts`, wasm workers under `lib/compiler/workers/`) lives entirely under `lib/compiler/`. The chat and voice features live under `lib/chat/` and `lib/voice/` respectively.
- Feature pages stay view-only. The chat surface is driven by `lib/chat/useChatSession.ts`, which owns the transcript, the explicit `ChatStatus`, and the single async pump that consumes the line stream; `useTypewriter.ts` owns the line in the input box and `useBackendHealth.ts` owns the backend probe. Keep view concerns (scrolling, focus, movie-mode layout) in `app/[locale]/chat/page.tsx` and session concerns in the hook — do not reintroduce pacing state as loose refs in the page.
- **Chat confidence is optional, and "missing" must stay missing.** `sseToLineStream` yields `perplexity: undefined` — never `0` — when the server streamed no logprobs for a line, and averages only over tokens that actually carried one. `perplexityToOpacity` plus the page's `msg.perplexity ?? 2` then render those lines at full opacity. Never "default" a missing logprob to `0`: a logprob of 0 means the model was *certain*, so that claims maximum confidence and silently pins every line to the same 55% opacity, turning the confidence display into a constant that looks like signal.

## Naming

These were unified repo-wide; follow them in new code.

- **Files** are camelCase: `useChatSession.ts`, `backgroundImage.tsx`, `waveformProgress.tsx`. The only exceptions are framework-reserved names — `page.tsx`, `layout.tsx`, `not-found.tsx`, `globals.css`, `favicon.ico`, and Rust's `lib.rs`. Do not add kebab-case or PascalCase source files.
- **Route components** export the PascalCase form of their route segment: `/chat` → `Chat`, `/voice` → `Voice`; the locale root exports `Home` like `app/page.tsx` does.
- **Module-level constants** are SCREAMING_SNAKE (`CHAT`, `VOICE`, `CODEBASE`, `LOCALES`, `TTS_SOCKET_URL`). Two exceptions: Next's reserved `metadata` export, and React context objects such as `ConfigContext`, which must stay PascalCase because they are rendered as providers.
- **Functions** are verb-first (`makeChatML`, `configureMonaco`, `makeTtsFilename`, `postChatCompletion`). Converters read `<input>To<output>`: `floatsToWav`, `pcmBufferToWav`, `perplexityToOpacity`. Hooks are `useXxx` in a matching `useXxx.ts`.
- **Imports** always use the `@/` alias, never `./` or `../`. This includes re-exports between sibling modules (`lib/config/index.ts` re-exports from `@/lib/config/en`) and the global stylesheet in `app/layout.tsx` (`import "@/app/globals.css"`). Only bare package specifiers (`next`, `react`, `eventsource-parser`) stay as-is.
- **Booleans** — internal state, refs and flag locals are prefixed `is` / `has` / `can`: `isVisible`, `isReadyForNext`, `isDraggingRef`, `isDisposedRef`, `hasStartedRef`. Three deliberate exceptions: component props stay bare adjectives (`disabled`, `blurred`), a ref that mirrors a value keeps the source name (`messagesRef`, `manualAdvanceRef`), and wire-format fields (`stream_audio`, `success`) must never be renamed — they are the server/WASM protocol.
