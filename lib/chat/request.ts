import { CHAT_COMPLETIONS_URL } from "@/lib/config/endpoints";
import { makeChatML, type DisplayMessage } from "@/lib/chat/messages";

/** The hosted Cyrene checkpoint served behind the LLM tunnel. */
const MODEL = "Qwen3.5-4B-Delta-me13-PhiLia093-LoRA";

const SAMPLING = {
  temperature: 0.5,
  top_p: 0.8,
  top_k: 40,
  presence_penalty: 1.0,
} as const;

/**
 * Opens a streamed chat completion for the given transcript.
 *
 * The transcript is merged with `makeChatML` first, so callers can pass the raw
 * per-line display messages.
 */
export function postChatCompletion(
  messages: DisplayMessage[],
): Promise<Response> {
  return fetch(CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...makeChatML(messages),
      model: MODEL,
      stream: true,
      logprobs: true,
      ...SAMPLING,
    }),
  });
}
