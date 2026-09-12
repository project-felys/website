"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PcmBuffer } from "@/lib/voice/pcmBuffer";
import { usePcmPlayer } from "@/lib/voice/usePcmPlayer";
import { openTtsSource, type TtsSessionConfig } from "@/lib/voice/ttsSource";
import { makeTtsFilename } from "@/lib/voice/format";
import { downloadBlob, pcmBufferToWav } from "@/lib/voice/wav";

export type VoiceHistoryEntry = {
  id: number;
  time: Date;
  text: string;
  speaker: string;
  language: string;
  seed: number;
  sealed: boolean;
  stream: PcmBuffer;
};

type Task = {
  id: number;
  stream: PcmBuffer;
  reader: ReadableStreamDefaultReader<Float32Array>;
};

export function useTts(sessionConfig: TtsSessionConfig) {
  const [attach, move, play, pause, status, cursor, total] = usePcmPlayer();
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<VoiceHistoryEntry[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  const idRef = useRef(0);
  const taskRef = useRef<Task | null>(null);
  const isDisposedRef = useRef(false);

  const activeStream =
    history.find((item) => item.id === activeId)?.stream ?? null;

  useEffect(() => {
    isDisposedRef.current = false;
    return () => {
      isDisposedRef.current = true;
      void taskRef.current?.reader.cancel();
    };
  }, []);

  const finish = useCallback((task: Task) => {
    task.stream.sealFrames();
    if (isDisposedRef.current) return;
    setHistory((prev) =>
      prev.map((item) =>
        item.id === task.id && !item.sealed ? { ...item, sealed: true } : item,
      ),
    );
    if (taskRef.current === task) {
      taskRef.current = null;
      setIsGenerating(false);
    }
  }, []);

  const generate = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      void taskRef.current?.reader.cancel();

      const id = ++idRef.current;
      const time = new Date();
      const stream = new PcmBuffer();
      const reader = openTtsSource(text, sessionConfig).getReader();
      const task = { id, stream, reader };

      taskRef.current = task;
      setHistory((prev) => [
        ...prev,
        {
          id,
          time,
          text,
          speaker: sessionConfig.speaker,
          language: sessionConfig.language,
          seed: sessionConfig.seed,
          sealed: false,
          stream,
        },
      ]);
      setActiveId(id);
      setIsGenerating(true);

      attach(stream);
      play();

      void (async () => {
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            stream.pushFrames(value);
          }
        } catch {
          // Errors are handled by finish(); the stream is sealed either way.
        } finally {
          reader.releaseLock();
          finish(task);
        }
      })();
    },
    [attach, play, sessionConfig, finish],
  );

  const select = useCallback(
    (id: number) => {
      const entry = history.find((item) => item.id === id);
      if (!entry) return;
      setActiveId(id);
      attach(entry.stream);
      play();
    },
    [attach, play, history],
  );

  const download = useCallback(
    (id: number) => {
      const entry = history.find((item) => item.id === id);
      if (!entry || entry.stream.length === 0) return;
      const wav = pcmBufferToWav(entry.stream);
      downloadBlob(
        new Blob([wav], { type: "audio/wav" }),
        makeTtsFilename(
          entry.text,
          entry.speaker,
          entry.language,
          entry.seed,
          entry.time,
        ),
      );
    },
    [history],
  );

  return {
    isGenerating,
    history,
    activeId,
    activeStream,
    status,
    cursor,
    total,
    generate,
    select,
    download,
    move,
    play,
    pause,
  };
}
