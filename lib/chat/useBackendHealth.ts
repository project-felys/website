import { useEffect, useRef } from "react";

export function useBackendHealth(onSuccess: () => void, onFail: () => void) {
  const isHealthCheckingRef = useRef(true);
  const callbacksRef = useRef({ onSuccess, onFail });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onFail };
  });

  useEffect(() => {
    const checkBackend = async () => {
      const res = await fetch("https://tunnel.felys.dev/health", {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        isHealthCheckingRef.current = false;
        callbacksRef.current.onSuccess();
      } else {
        callbacksRef.current.onFail();
      }
    };
    checkBackend();
  }, []);

  return isHealthCheckingRef;
}
