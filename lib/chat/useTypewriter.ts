"use client";

import { useCallback, useState } from "react";

/**
 * Owns the single line shown in the chat box — the "teleprompter" — together
 * with the speaker label above it and a key that remounts the textarea so its
 * mount animation replays once per line.
 *
 * The visible line and the user's draft share one state deliberately: the box is
 * read-only whenever the session is busy, so a draft and an animated line can
 * never need to be on screen at the same time.
 */
export function useTypewriter(initialSpeaker: string, initialText: string) {
  const [speaker, setSpeaker] = useState(initialSpeaker);
  const [text, setText] = useState(initialText);
  const [animationKey, setAnimationKey] = useState(0);

  /** Swaps the speaker label and the line together. */
  const cue = useCallback((speaker: string, text: string) => {
    setSpeaker(speaker);
    setText(text);
    setAnimationKey((key) => key + 1);
  }, []);

  /** Swaps the line only, keeping whoever is currently speaking. */
  const cueStatus = useCallback((text: string) => {
    setText(text);
    setAnimationKey((key) => key + 1);
  }, []);

  return {
    speaker,
    text,
    animationKey,
    cue,
    cueStatus,
    /** Raw setter for the draft the user is typing. */
    edit: setText,
  };
}
