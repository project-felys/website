"use client";

import { useEffect, useRef, useState } from "react";
import { BACKEND_HEALTH_URL } from "@/lib/config/endpoints";

export type BackendHealth = "checking" | "ready" | "unavailable";

const HEALTH_TIMEOUT_MS = 5000;

/**
 * One-shot probe of the LLM tunnel.
 *
 * `onReady` is called from the fetch continuation rather than from an effect
 * body, so callers can start work on a fresh backend without scheduling state
 * updates during the effect itself. The request is aborted on unmount so a slow
 * tunnel cannot resolve into an unmounted component.
 */
export function useBackendHealth(onReady?: () => void): BackendHealth {
  const [status, setStatus] = useState<BackendHealth>("checking");
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    void (async () => {
      try {
        const response = await fetch(BACKEND_HEALTH_URL, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        if (response.ok) {
          setStatus("ready");
          onReadyRef.current?.();
        } else {
          setStatus("unavailable");
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatus("unavailable");
        }
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return status;
}
