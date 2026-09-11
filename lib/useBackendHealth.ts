"use client";

import { useEffect, useEffectEvent, useState } from "react";

export type BackendHealth = "checking" | "ready" | "unavailable";

export type BackendHealthOptions = {
  url: string;
  timeoutMs?: number;
  onReady?: () => void;
};

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * One-shot probe of a backend health endpoint.
 *
 * `onReady` is called from the fetch continuation rather than from an effect
 * body, so callers can start work on a fresh backend without scheduling state
 * updates during the effect itself. The request is aborted on unmount or on
 * timeout so a slow tunnel cannot resolve into an unmounted component.
 */
export function useBackendHealth({
  url,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onReady,
}: BackendHealthOptions): BackendHealth {
  const [status, setStatus] = useState<BackendHealth>("checking");
  const onReadyEvent = useEffectEvent(() => onReady?.());

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(timeoutMs),
    ]);

    void fetch(url, { signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        if (response.ok) {
          setStatus("ready");
          onReadyEvent();
        } else {
          setStatus("unavailable");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus("unavailable");
        }
      });

    return () => {
      controller.abort();
    };
  }, [url, timeoutMs]);

  return status;
}
