"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatText } from "@/lib/config/types";
import { BACKEND_HEALTH_URL } from "@/lib/config/endpoints";
import { postChatCompletion } from "@/lib/chat/request";
import { Message } from "@/lib/chat/message";
import { sseToLineStream, type LineStreamResult } from "@/lib/chat/sse";
import { useBackendHealth } from "@/lib/useBackendHealth";
import { useTypewriter } from "@/lib/chat/useTypewriter";

/** How long each streamed line stays on screen before the next one is taken. */
const PACE_MS = 400;
/** How long a failure message stays up before the input comes back. */
const FAILURE_HOLD_MS = 2000;
/** How long between two removed lines while a conversation reset runs. */
const RESET_PACE_MS = 200;
/** How long the reset pauses after the last line before reopening. */
const RESET_HOLD_MS = 500;

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
 * without having to await it. That replaces the previous arrangement of several
 * booleans plus refs, where two concurrent loops could read from the same
 * iterator.
 */
export function useChatSession(text: ChatText) {
  const [messages, setMessages] = useState(
    () => new Message(text.systemPrompt),
  );
  const [turn, setTurn] = useState<TurnStatus>("idle");
  const [isResetting, setIsResetting] = useState(false);

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
  const hasStartedRef = useRef(false);
  const isResettingRef = useRef(false);

  const backToInput = useCallback(() => {
    iteratorRef.current = null;
    setTurn("idle");
    cue(text.userName, "");
  }, [cue, text.userName]);

  const applyLine = useCallback(
    (value: LineStreamResult) => {
      messagesRef.current = messagesRef.current.appended(
        "assistant",
        value.line,
        value.perplexity,
      );
      setMessages(messagesRef.current);
      cue(text.cyreneName, value.line);
    },
    [cue, text.cyreneName],
  );

  const failTurn = useCallback(async () => {
    pumpTokenRef.current += 1;
    cueStatus(text.failedToSendMessageText);
    await delay(FAILURE_HOLD_MS);
    backToInput();
  }, [backToInput, cueStatus, text.failedToSendMessageText]);

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
        }
      } catch {
        // Aborted or failed mid-stream: hand control back to the input.
        if (alive()) await failTurn();
      }
    },
    [applyLine, backToInput, failTurn],
  );

  const send = useCallback(
    async (content: string) => {
      const next = messagesRef.current.appended("user", content);
      // An empty message is still part of the request, but adds no visible line.
      if (content) {
        messagesRef.current = next;
        setMessages(next);
      }

      setTurn("sending");
      cue(text.systemName, text.sendingMessageText);

      try {
        const response = await postChatCompletion(next.toChatMessages());
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

  /** Opens the conversation with the initial empty message. */
  const startConversation = useCallback(() => {
    void send("");
  }, [send]);

  /** Deletes the conversation line by line, then reopens it. */
  const resetConversation = useCallback(async () => {
    if (isResettingRef.current) return;
    isResettingRef.current = true;
    setIsResetting(true);
    try {
      // The system lines are baked into the model and never popped, so the
      // animation stops once only they remain.
      while (!messagesRef.current.isOnlySystem) {
        messagesRef.current = messagesRef.current.popped();
        setMessages(messagesRef.current);
        await delay(RESET_PACE_MS);
      }

      // A deliberate beat before the conversation reopens. `isResetting` stays
      // true throughout, keeping the button and the box disabled so a re-click
      // cannot fire a duplicate opening request.
      await delay(RESET_HOLD_MS);

      // The background is revealed only while lines are being removed; it
      // blurs back as the reopened conversation takes over. Both updates land
      // in the same render batch, so the button hands over to `readOnly`
      // without a clickable gap.
      setIsResetting(false);

      await startConversation();
    } finally {
      isResettingRef.current = false;
      setIsResetting(false);
    }
  }, [startConversation]);

  // Kick the conversation off once the backend answers.
  const kickoff = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startConversation();
  }, [startConversation]);

  // Declared after `send` so the probe can start the first turn directly, which
  // keeps the kickoff out of an effect body.
  const health = useBackendHealth({ url: BACKEND_HEALTH_URL, onReady: kickoff });

  // Drop the in-flight stream when the page goes away.
  useEffect(() => {
    return () => {
      pumpTokenRef.current += 1;
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
    isResetting,
    resetConversation,
  };
}
