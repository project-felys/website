export type Role = "system" | "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
};

export type DisplayMessage = {
  role: Role;
  content: string;
  perplexity?: number;
};

export function makeChatML(messages: DisplayMessage[]): ChatMessage[] {
  const merged: ChatMessage[] = [];
  for (const msg of messages) {
    if (merged.length === 0) {
      merged.push({ role: msg.role, content: msg.content });
      continue;
    }

    const lastMerged = merged[merged.length - 1];
    if (lastMerged.role === msg.role) {
      lastMerged.content += "\n" + msg.content;
    } else {
      merged.push({ role: msg.role, content: msg.content });
    }
  }
  return merged;
}

export function makeDisplayMessages(
  role: Role,
  line: string,
): DisplayMessage[] {
  return line.split("\n").map((content) => ({
    role,
    content,
  }));
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
