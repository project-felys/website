"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioStream } from "./AudioStream";
import { usePlayer } from "./usePlayer";
import {
  TtsStreamClient,
  type TtsSessionConfig,
} from "./TtsStream";
import { audioStreamToWav, downloadBlob, ttsDownloadFilename } from "./wav";

export type VoiceHistoryEntry = {
  id: number;
  time: Date;
  text: string;
  sealed: boolean;
};

export function useTtsStream(sessionConfig: TtsSessionConfig) {
  const [attach, reset, move, play, pause, status, cursor, total] = usePlayer();
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<VoiceHistoryEntry[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeStream, setActiveStream] = useState<AudioStream | null>(null);

  const idRef = useRef(0);
  const clientRef = useRef<TtsStreamClient | null>(null);
  const entriesRef = useRef(
    new Map<number, { time: Date; stream: AudioStream; text: string }>(),
  );

  useEffect(() => {
    return () => {
      clientRef.current?.close();
    };
  }, []);

  const generate = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      clientRef.current?.close();

      const id = ++idRef.current;
      const time = new Date();
      const stream = new AudioStream();
      entriesRef.current.set(id, { time, stream, text });
      setHistory((h) => [...h, { id, time, text, sealed: false }]);
      setActiveId(id);
      setActiveStream(stream);
      setIsGenerating(true);

      attach(stream);
      play();

      const client = new TtsStreamClient({
        onChunk: (frames) => stream.pushFrames(frames),
        onDone: () => {
          stream.sealFrames();
          setIsGenerating(false);
          setHistory((h) =>
            h.map((it) => (it.id === id ? { ...it, sealed: true } : it)),
          );
        },
        onError: () => {
          stream.sealFrames();
          setIsGenerating(false);
          setHistory((h) =>
            h.map((it) => (it.id === id ? { ...it, sealed: true } : it)),
          );
        },
      });
      clientRef.current = client;
      client.generate(text, sessionConfig);
    },
    [attach, play, sessionConfig],
  );

  const select = useCallback(
    (id: number) => {
      const entry = entriesRef.current.get(id);
      if (!entry) return;
      setActiveId(id);
      setActiveStream(entry.stream);
      attach(entry.stream);
      play();
    },
    [attach, play],
  );

  const download = useCallback((id: number) => {
    const entry = entriesRef.current.get(id);
    if (!entry || entry.stream.length === 0) return;
    const wav = audioStreamToWav(entry.stream);
    downloadBlob(
      new Blob([wav], { type: "audio/wav" }),
      ttsDownloadFilename(entry.text, entry.time),
    );
  }, []);

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
    reset,
  };
}
