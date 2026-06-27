import { createParser } from "eventsource-parser";

export interface LineStreamResult {
  line: string;
  perplexity: number;
}

export async function* sseToLineStream(
  response: Response,
): AsyncGenerator<LineStreamResult> {
  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to connect to SSE stream: ${response.status} ${response.statusText}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let lineBuffer = "";
  let currentLineSumLogprobs = 0;
  let currentLineNumTokens = 0;

  const pendingItems: LineStreamResult[] = [];
  let isFinished = false;

  const parser = createParser({
    onEvent: (event) => {
      if (event.data.trim() === "[DONE]") {
        isFinished = true;
        return;
      }

      try {
        const json = JSON.parse(event.data);
        const choice0 = json.choices?.[0];

        const content = choice0?.delta?.content;
        if (typeof content !== "string") return;

        if (content === "\n") {
          const perplexity =
            currentLineNumTokens > 0
              ? Math.exp(-currentLineSumLogprobs / currentLineNumTokens)
              : 0;

          pendingItems.push({ line: lineBuffer, perplexity });

          lineBuffer = "";
          currentLineSumLogprobs = 0;
          currentLineNumTokens = 0;
        } else {
          const logprob = choice0?.logprobs?.content?.[0]?.logprob || 0;
          lineBuffer += content;
          currentLineSumLogprobs += logprob;
          currentLineNumTokens += 1;
        }
      } catch {
        throw new Error(`Failed to parse SSE data as JSON: ${event.data}`);
      }
    },
  });

  try {
    while (!isFinished) {
      if (pendingItems.length > 0) {
        yield pendingItems.shift()!;
        continue;
      }

      const { done, value } = await reader.read();
      if (done) {
        isFinished = true;
        continue;
      }

      parser.feed(decoder.decode(value, { stream: true }));
    }

    if (lineBuffer) {
      const perplexity =
        currentLineNumTokens > 0
          ? Math.exp(-currentLineSumLogprobs / currentLineNumTokens)
          : 0;
      yield { line: lineBuffer, perplexity };
    }
  } finally {
    reader.releaseLock();
  }
}
