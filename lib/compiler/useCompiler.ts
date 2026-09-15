"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CODEBASE, type Codebase } from "@/lib/compiler/codebase";

const COMPILE_TIMEOUT_MS = 5000;
const EXECUTE_TIMEOUT_MS = 5000;

function applyToProgram(
  prev: Codebase,
  index: number,
  patch: Partial<Codebase["programs"][number]>,
): Codebase {
  return {
    ...prev,
    programs: prev.programs.map((x, i) =>
      i === index ? { ...x, ...patch } : x,
    ),
  };
}

export function useCompiler() {
  const [codebase, setCodebase] = useState<Codebase>(CODEBASE);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const compileWorkerRef = useRef<Worker | null>(null);
  const executeWorkerRef = useRef<Worker | null>(null);

  const program = codebase.programs[codebase.cursor];

  useEffect(() => {
    return () => {
      compileWorkerRef.current?.terminate();
      executeWorkerRef.current?.terminate();
    };
  }, []);

  const moveCursor = useCallback((key: number) => {
    setCodebase((prev) => ({ ...prev, cursor: key }));
  }, []);

  const handleCompile = useCallback(() => {
    if (isCompiling) return;

    // Results must land on the program that was submitted, not on whichever
    // one is selected when the worker answers (the cursor can move mid-run).
    const index = codebase.cursor;

    compileWorkerRef.current?.terminate();

    const worker = new Worker(
      new URL("@/lib/compiler/workers/compile.ts", import.meta.url),
    );
    compileWorkerRef.current = worker;
    setIsCompiling(true);

    const timeoutId = setTimeout(() => {
      worker.terminate();
      compileWorkerRef.current = null;
      setIsCompiling(false);
      setCodebase((prev) =>
        applyToProgram(prev, index, {
          outcome: {
            stdout: "",
            result: "δ-me13: compiler timeout",
            success: false,
          },
        }),
      );
    }, COMPILE_TIMEOUT_MS);

    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();
      compileWorkerRef.current = null;
      setIsCompiling(false);

      const { binary, outcome } = e.data;

      setCodebase((prev) => applyToProgram(prev, index, { binary, outcome }));
    };

    worker.onerror = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();
      compileWorkerRef.current = null;
      setIsCompiling(false);
      setCodebase((prev) =>
        applyToProgram(prev, index, {
          outcome: {
            stdout: "",
            result: e.message || "δ-me13: compiler crashed",
            success: false,
          },
        }),
      );
    };

    worker.postMessage({ code: program.code, o: 1 });
  }, [codebase.cursor, isCompiling, program.code]);

  const handleExecute = useCallback(() => {
    if (isExecuting) return;

    // Same attribution rule as compilation: pin the submitted program.
    const index = codebase.cursor;

    executeWorkerRef.current?.terminate();

    const worker = new Worker(
      new URL("@/lib/compiler/workers/execute.ts", import.meta.url),
    );
    executeWorkerRef.current = worker;
    setIsExecuting(true);

    const timeoutId = setTimeout(() => {
      worker.terminate();
      executeWorkerRef.current = null;
      setIsExecuting(false);
      setCodebase((prev) =>
        applyToProgram(prev, index, {
          outcome: {
            stdout: "",
            result: "δ-me13: virtual machine timeout",
            success: false,
          },
        }),
      );
    }, EXECUTE_TIMEOUT_MS);

    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();
      executeWorkerRef.current = null;
      setIsExecuting(false);

      const outcome = e.data;

      setCodebase((prev) => applyToProgram(prev, index, { outcome }));
    };

    worker.onerror = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();
      executeWorkerRef.current = null;
      setIsExecuting(false);
      setCodebase((prev) =>
        applyToProgram(prev, index, {
          outcome: {
            stdout: "",
            result: e.message || "δ-me13: virtual machine crashed",
            success: false,
          },
        }),
      );
    };

    worker.postMessage({ binary: program.binary });
  }, [codebase.cursor, isExecuting, program.binary]);

  const handleCodeChange = useCallback(
    (newCode: string | undefined) => {
      if (newCode === undefined || newCode === program.code) {
        return;
      }

      setCodebase((prev) =>
        applyToProgram(prev, prev.cursor, {
          code: newCode,
          binary: undefined,
        }),
      );
    },
    [program.code],
  );

  return {
    codebase,
    isCompiling,
    isExecuting,
    moveCursor,
    handleCompile,
    handleExecute,
    handleCodeChange,
  };
}
