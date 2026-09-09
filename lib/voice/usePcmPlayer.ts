"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { PcmPlayer, type PlayerStatus } from "./pcmPlayer";

export { PCM_SAMPLE_RATE } from "./pcmPlayer";
export type { PlayerStatus } from "./pcmPlayer";

export function usePcmPlayer() {
  const [engine] = useState(() => new PcmPlayer());
  useEffect(() => () => engine.destroy(), [engine]);
  const status = useSyncExternalStore(
    engine.subscribe,
    () => engine.status,
    () => "idle" as PlayerStatus,
  );
  const cursor = useSyncExternalStore(
    engine.subscribe,
    () => engine.cursor,
    () => 0,
  );
  const total = useSyncExternalStore(
    engine.subscribe,
    () => engine.total,
    () => 0,
  );

  return [
    engine.attach,
    engine.move,
    engine.play,
    engine.pause,
    status,
    cursor,
    total,
  ] as const;
}
