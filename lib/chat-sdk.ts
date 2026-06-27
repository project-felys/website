import { useEffect, useRef } from "react";

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

export function makeChatML(messages: DisplayMessage[]): {
  messages: ChatMessage[];
} {
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
  return { messages: merged };
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

export function useBackendHealth(onSuccess: () => void, onFail: () => void) {
  const isHealthCheckingRef = useRef(true);

  const checkBackend = async () => {
    const res = await fetch("/api/health", {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      isHealthCheckingRef.current = false;
      onSuccess();
    } else {
      onFail();
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  return isHealthCheckingRef;
}

export function perplexityToOpacity(x: number): number {
  if (x < 1) {
    return 0;
  } else if (x < 2) {
    return x - 1;
  } else if (x < 4) {
    return 1;
  } else if (x < 10) {
    return (10 - x) / 6;
  } else {
    return 0;
  }
}
