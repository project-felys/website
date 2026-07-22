<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Felys website

Next.js 16 app (App Router, React 19, TS strict, Tailwind v4) that hosts a Felys-language playground. Three surfaces live under `app/[locale]/`: `compiler` (Monaco editor + WASM), `chat` (LLM proxy), `portfolio`.

## Build prerequisites — read this first

- `wasm/pkg/` is gitignored (see `wasm/pkg/.gitignore`). The app imports `@/wasm/pkg` in `lib/workers/compile.ts` and `lib/workers/execute.ts`, so **you must build the WASM artifact before `next dev` or `next build` will work**:
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

- `.env` (committed) defines `OPENAI_SERVICE_PROVIDER` — the base URL hit by `app/api/chat/route.ts` and `app/api/health/route.ts`. The chat feature is non-functional if that host is unreachable.
- `.env.local` is gitignored and holds a Vercel OIDC token; never commit it.
- `next.config.ts` injects `NEXT_PUBLIC_BUILD_DATE` (computed at build time, shown as the "version" in the compiler page). Do not replace it with a static value.

## Conventions that differ from defaults

- **Tailwind v4**, configured via `@import "tailwindcss"` + `@theme` in `app/globals.css`. There is no `tailwind.config.js`. Custom color token `--color-pink` enables the `text-pink` / `bg-pink` utilities used throughout.
- **i18n is hand-rolled**, not next-intl. Locales are `en` and `zh`, declared via `generateStaticParams` in `app/[locale]/layout.tsx` and served from the `EN`/`ZH` objects in `lib/config.ts`. `app/page.tsx` redirects to `/en`. Add new locales by extending both `lib/config.ts` and the static params.
- Path alias: `@/*` → repo root (e.g. `@/lib/...`, `@/components/...`, `@/wasm/pkg`, `@/public/...`).
- `app/layout.tsx` returns `children` directly (no wrapping `<html>`/`<body>`); the per-locale `<html>` is emitted by `app/[locale]/layout.tsx`. Keep this split.
- Monaco editor language `felys` and theme `felys-dark` are registered imperatively in `app/[locale]/compiler/page.tsx` (`monacoConfig`); tokenizer and theme live there, not in a separate config file.
