import { CHAT_COMPLETIONS_URL } from "@/lib/config/endpoints";
import type { ChatMessage } from "@/lib/chat/message";

/** The hosted Cyrene checkpoint served behind the LLM tunnel. */
const MODEL = "Qwen3.5-4B-Delta-me13-PhiLia093-LoRA";

/**
 * Opens a streamed chat completion for the given transcript, already in the
 * merged ChatML form (`Message.toChatMessages`).
 */
export function postChatCompletion(chat: ChatMessage[]): Promise<Response> {
  return fetch(CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: chat,
      model: MODEL,
      stream: true,
      logprobs: true,
      temperature: 0.9,
      top_p: 0.9,
      top_k: 50,
    }),
  });
}
