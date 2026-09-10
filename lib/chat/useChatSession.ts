"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatText } from "@/lib/config/types";
import { postChatCompletion } from "@/lib/chat/request";
import { makeDisplayMessages, type DisplayMessage } from "@/lib/chat/messages";
import { sseToLineStream, type LineStreamResult } from "@/lib/chat/sse";
import { useBackendHealth } from "@/lib/chat/useBackendHealth";
import { useTypewriter } from "@/lib/chat/useTypewriter";

/** How long each streamed line stays on screen before the next one is taken. */
const PACE_MS = 400;
/** How long a failure message stays up before the input comes back. */
const FAILURE_HOLD_MS = 2000;

/** Phase of the current turn, independent of the backend probe. */
type TurnStatus = "idle" | "sending" | "streaming";

export type ChatStatus =
  | "connecting"
  | "unavailable"
  | "idle"
  | "sending"
  | "streaming";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Drives one conversation with the streamed chat backend.
 *
 * Exactly one pump owns the line iterator at any time. The pump is identified by
 * a token, so starting a new turn (or unmounting) invalidates the previous one
 * without having to await it, and a pump parked on the manual gate is released
 * when that happens. That replaces the previous arrangement of several booleans
 * plus refs, where two concurrent loops could read from the same iterator.
 */
export function useChatSession({
  manualAdvance,
  text,
}: {
  /** When true the session waits for `advance()` between lines (movie mode). */
  manualAdvance: boolean;
  text: ChatText;
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    makeDisplayMessages("system", text.systemPrompt),
  );
  const [turn, setTurn] = useState<TurnStatus>("idle");
  /** True only while a manual session is parked, waiting for a click. */
  const [isReadyForNext, setIsReadyForNext] = useState(false);

  const {
    speaker,
    text: marquee,
    animationKey,
    cue,
    cueStatus,
    edit,
  } = useTypewriter(text.systemName, text.healthCheckingText);

  const messagesRef = useRef(messages);
  const iteratorRef = useRef<AsyncIterableIterator<LineStreamResult> | null>(
    null,
  );
  /** Only the pump holding the newest token is allowed to touch state. */
  const pumpTokenRef = useRef(0);
  /** Resolver for the manual gate, or null when no pump is parked. */
  const gateRef = useRef<(() => void) | null>(null);
  const manualAdvanceRef = useRef(manualAdvance);
  const hasStartedRef = useRef(false);

  const releaseGate = useCallback(() => {
    const resolve = gateRef.current;
    gateRef.current = null;
    resolve?.();
  }, []);

  const waitForGate = useCallback(() => {
    return new Promise<void>((resolve) => {
      gateRef.current = resolve;
    });
  }, []);

  const appendMessage = useCallback((message: DisplayMessage) => {
    messagesRef.current = [...messagesRef.current, message];
    setMessages(messagesRef.current);
  }, []);

  const backToInput = useCallback(() => {
    iteratorRef.current = null;
    setIsReadyForNext(false);
    setTurn("idle");
    cue(text.userName, "");
  }, [cue, text.userName]);

  const applyLine = useCallback(
    (value: LineStreamResult) => {
      appendMessage({
        role: "assistant",
        content: value.line,
        perplexity: value.perplexity,
      });
      cue(text.cyreneName, value.line);
    },
    [appendMessage, cue, text.cyreneName],
  );

  const failTurn = useCallback(async () => {
    pumpTokenRef.current += 1;
    releaseGate();
    setIsReadyForNext(false);
    cueStatus(text.failedToSendMessageText);
    await delay(FAILURE_HOLD_MS);
    backToInput();
  }, [backToInput, cueStatus, releaseGate, text.failedToSendMessageText]);

  const pump = useCallback(
    async (
      iterator: AsyncIterableIterator<LineStreamResult>,
      token: number,
    ) => {
      const alive = () => pumpTokenRef.current === token;

      try {
        for (;;) {
          const next = await iterator.next();
          if (!alive()) return;

          if (next.done) {
            backToInput();
            return;
          }

          applyLine(next.value);
          await delay(PACE_MS);
          if (!alive()) return;

          if (manualAdvanceRef.current) {
            setIsReadyForNext(true);
            await waitForGate();
            if (!alive()) return;
            setIsReadyForNext(false);
          }
        }
      } catch {
        // Aborted or failed mid-stream: hand control back to the input.
        if (alive()) await failTurn();
      }
    },
    [applyLine, backToInput, failTurn, waitForGate],
  );

  const send = useCallback(
    async (content: string) => {
      const payload = [
        ...messagesRef.current,
        ...makeDisplayMessages("user", content),
      ];
      // An empty message is still part of the request, but adds no visible line.
      if (content) {
        messagesRef.current = payload;
        setMessages(payload);
      }

      setIsReadyForNext(false);
      setTurn("sending");
      cue(text.systemName, text.sendingMessageText);

      try {
        const response = await postChatCompletion(payload);
        cueStatus(text.waitingForReplyText);

        const iterator = sseToLineStream(response);
        iteratorRef.current = iterator;
        setTurn("streaming");

        pumpTokenRef.current += 1;
        await pump(iterator, pumpTokenRef.current);
      } catch {
        await failTurn();
      }
    },
    [
      cue,
      cueStatus,
      failTurn,
      pump,
      text.sendingMessageText,
      text.systemName,
      text.waitingForReplyText,
    ],
  );

  // Kick the conversation off with an empty message once the backend answers.
  const kickoff = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void send("");
  }, [send]);

  // Declared after `send` so the probe can start the first turn directly, which
  // keeps the kickoff out of an effect body.
  const health = useBackendHealth(kickoff);

  // The pump reads movie mode asynchronously, so leaving movie mode has to
  // release a pump that is already parked on the gate.
  useEffect(() => {
    manualAdvanceRef.current = manualAdvance;
    if (!manualAdvance) {
      releaseGate();
    }
  }, [manualAdvance, releaseGate]);

  // Drop the in-flight stream when the page goes away.
  useEffect(() => {
    return () => {
      pumpTokenRef.current += 1;
      gateRef.current?.();
      gateRef.current = null;
      void iteratorRef.current?.return?.(undefined);
    };
  }, []);

  const status: ChatStatus =
    health === "checking"
      ? "connecting"
      : health === "unavailable"
        ? "unavailable"
        : turn;

  return {
    status,
    messages,
    speaker,
    // While the backend is unreachable the box shows the failure notice.
    line: status === "unavailable" ? text.healthCheckFailedText : marquee,
    animationKey,
    edit,
    send,
    /** Releases the manual gate so the next line is taken. */
    advance: releaseGate,
    canAdvance: manualAdvance && isReadyForNext,
  };
}
