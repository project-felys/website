import { createParser } from "eventsource-parser";

export interface LineStreamResult {
  line: string;
  perplexity: number;
}

/** Geometric mean perplexity of a line, or 0 when it carried no logprobs. */
function perplexityOf(sumLogprobs: number, numTokens: number): number {
  return numTokens > 0 ? Math.exp(-sumLogprobs / numTokens) : 0;
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

  const flushLine = () => {
    pendingItems.push({
      line: lineBuffer,
      perplexity: perplexityOf(currentLineSumLogprobs, currentLineNumTokens),
    });

    lineBuffer = "";
    currentLineSumLogprobs = 0;
    currentLineNumTokens = 0;
  };

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

        const logprob = choice0?.logprobs?.content?.[0]?.logprob || 0;

        // One delta can carry several newlines, or text and a newline together,
        // so split instead of comparing the whole delta against "\n".
        content.split("\n").forEach((part, index) => {
          if (index > 0) {
            flushLine();
          }
          if (part) {
            lineBuffer += part;
            currentLineSumLogprobs += logprob;
            currentLineNumTokens += 1;
          }
        });
      } catch {
        throw new Error(`Failed to parse SSE data as JSON: ${event.data}`);
      }
    },
  });

  try {
    // Drain before stopping: a `[DONE]` frame can arrive in the same chunk as
    // the newline that completed a line, and those lines would be dropped if the
    // loop exited on the flag alone.
    while (!isFinished || pendingItems.length > 0) {
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
      yield {
        line: lineBuffer,
        perplexity: perplexityOf(currentLineSumLogprobs, currentLineNumTokens),
      };
    }
  } finally {
    try {
      // Cancel the body too: a `[DONE]` frame, or a consumer that stops early,
      // would otherwise leave the response unread.
      await reader.cancel();
    } catch {
      // The stream was already consumed or errored.
    }
    reader.releaseLock();
  }
}
