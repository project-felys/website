import { createParser } from "eventsource-parser";

export interface LineStreamResult {
  line: string;
  /** Absent when the server streamed no logprobs for this line. */
  perplexity?: number;
}

/**
 * Geometric mean perplexity over the tokens that actually carried a logprob.
 *
 * Returns `undefined` — not 0 — when a line has none. A logprob of 0 means the
 * model was certain, so folding "no data" into 0 would claim maximum confidence
 * and pin every line to the same opacity. Callers treat a missing value as "no
 * signal" and render the line at full opacity.
 */
function perplexityOf(
  sumLogprobs: number,
  numLogprobs: number,
): number | undefined {
  return numLogprobs > 0 ? Math.exp(-sumLogprobs / numLogprobs) : undefined;
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
  // Counts only the tokens that carried a logprob, so a partially reported line
  // is averaged over real samples instead of being diluted towards "certain".
  let currentLineNumLogprobs = 0;

  const pendingItems: LineStreamResult[] = [];
  let isFinished = false;

  const flushLine = () => {
    pendingItems.push({
      line: lineBuffer,
      perplexity: perplexityOf(currentLineSumLogprobs, currentLineNumLogprobs),
    });

    lineBuffer = "";
    currentLineSumLogprobs = 0;
    currentLineNumLogprobs = 0;
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

        // Keep `undefined` as "the server reported nothing"; only a real number
        // is a confidence signal.
        const logprob = choice0?.logprobs?.content?.[0]?.logprob;
        const hasLogprob = typeof logprob === "number";

        // One delta can carry several newlines, or text and a newline together,
        // so split instead of comparing the whole delta against "\n".
        content.split("\n").forEach((part, index) => {
          if (index > 0) {
            flushLine();
          }
          if (part) {
            lineBuffer += part;
            if (hasLogprob) {
              currentLineSumLogprobs += logprob;
              currentLineNumLogprobs += 1;
            }
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
        perplexity: perplexityOf(currentLineSumLogprobs, currentLineNumLogprobs),
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
