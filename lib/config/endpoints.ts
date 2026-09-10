/**
 * Every external service the site talks to, in one place.
 *
 * These are hit directly from the browser; there are no `/api` route handlers.
 */

/** Chat completions endpoint of the self-hosted LLM tunnel. */
export const CHAT_COMPLETIONS_URL = "https://llm.felys.dev/v1/chat/completions";

/** Health probe of the same tunnel. */
export const BACKEND_HEALTH_URL = "https://llm.felys.dev/health";

/** WebSocket endpoint of the streaming text-to-speech service. */
export const TTS_SOCKET_URL = "wss://tts.felys.dev/v1/audio/speech/stream";

/** Landing page of the Felys language book. */
export const BOOK_URL = "https://book.felys.dev";
