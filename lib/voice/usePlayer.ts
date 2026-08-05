"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { PlayerEngine, type PlayerStatus } from "./PlayerEngine";

export { PLAYER_SAMPLE_RATE } from "./PlayerEngine";
export type { PlayerStatus } from "./PlayerEngine";

export function usePlayer() {
  const [engine] = useState(() => new PlayerEngine());
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
    engine.reset,
    engine.move,
    engine.play,
    engine.pause,
    status,
    cursor,
    total,
  ] as const;
}
