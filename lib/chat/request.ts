import { CHAT_COMPLETIONS_URL } from "@/lib/config/endpoints";
import { makeChatML, type DisplayMessage } from "@/lib/chat/messages";

/** The hosted Cyrene checkpoint served behind the LLM tunnel. */
const MODEL = "Qwen3.5-4B-Delta-me13-PhiLia093-LoRA";

/**
 * Opens a streamed chat completion for the given transcript.
 *
 * The transcript is merged with `makeChatML` first, so callers can pass the raw
 * per-line display messages.
 */
export function postChatCompletion(
  displayMessages: DisplayMessage[],
): Promise<Response> {
  return fetch(CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: makeChatML(displayMessages),
      model: MODEL,
      stream: true,
      logprobs: true,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 50,
    }),
  });
}
