export type Role = "system" | "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
};

export type DisplayMessage = {
  role: Role;
  line: string;
  perplexity?: number;
};

/**
 * One conversation, held as per-line display entries.
 *
 * The system prompt is baked in at construction and can never be popped:
 * `popped` only removes conversation entries, so a reset can delete the
 * dialogue line by line while the system lines stay put. The model is
 * immutable — `appended` and `popped` return new instances — so React state
 * can hold one directly and re-render on every change, and a caller can build
 * a turn's payload from a copy without committing it.
 */
export class Message {
  constructor(
    private readonly systemPrompt: string,
    private readonly conversation: DisplayMessage[] = [],
  ) {}

  /** The baked-in system prompt, split into per-line system entries. */
  private get systemLines(): DisplayMessage[] {
    return this.systemPrompt
      .split("\n")
      .map((line) => ({ role: "system", line }));
  }

  /** Every entry in order: the baked-in system lines, then the conversation. */
  private get entries(): DisplayMessage[] {
    return [...this.systemLines, ...this.conversation];
  }

  /**
   * Returns a transcript with a raw line appended, split into per-line entries.
   *
   * Streamed lines never contain a newline and land as a single entry, while
   * user input can span several lines and is split the same way as the prompt
   * lines, keeping the per-line display uniform.
   */
  appended(role: Role, line: string, perplexity?: number): Message {
    const added = line.split("\n").map((part) => ({
      role,
      line: part,
      perplexity,
    }));
    return new Message(this.systemPrompt, [...this.conversation, ...added]);
  }

  /** The per-line entries, for rendering. */
  toDisplayMessages(): DisplayMessage[] {
    return this.entries;
  }

  /** Consecutive same-role entries merged — the ChatML wire format. */
  toChatMessages(): ChatMessage[] {
    const merged: ChatMessage[] = [];
    for (const msg of this.entries) {
      const last = merged[merged.length - 1];
      if (last && last.role === msg.role) {
        last.content += "\n" + msg.line;
      } else {
        merged.push({ role: msg.role, content: msg.line });
      }
    }
    return merged;
  }

  /** Returns a transcript without its last conversation entry. */
  popped(): Message {
    return new Message(this.systemPrompt, this.conversation.slice(0, -1));
  }

  /** True when no conversation entries are left to pop. */
  get isOnlySystem(): boolean {
    return this.conversation.length === 0;
  }
}

export function perplexityToOpacity(x: number): number {
  if (x < 0.5) {
    return 0;
  } else if (x < 1.5) {
    return x - 0.5;
  } else if (x < 4) {
    return 1;
  } else if (x < 10) {
    return (10 - x) / 6;
  } else {
    return 0;
  }
}
