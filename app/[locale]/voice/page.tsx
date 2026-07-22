"use client";

import Navigator from "@/components/navigator";
import { useConfig } from "@/components/i18n";
import { useEffect, useRef, useState } from "react";

const TTS_URL = "wss://tunnel.felys.dev/v1/audio/speech/stream";
const PCM_SAMPLE_RATE = 24000;

const SESSION_CONFIG = {
  speaker: "cyrene",
  task_type: "CustomVoice",
  language: "Auto",
  response_format: "pcm",
  stream_audio: true,
  speed: 1.0,
};

type TtsFrame =
  | { type: "audio.start"; sentence_index: number; sentence_text?: string }
  | {
      type: "audio.chunk";
      audio_b64?: string;
      sentence_index: number;
      chunk_id: number;
    }
  | { type: "audio.done"; sentence_index: number; total_bytes?: number }
  | { type: "session.done"; total_sentences: number }
  | { type: "error"; message: string };

function decodeBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function pcmToAudioBuffer(
  audioContext: AudioContext,
  pcmBuffer: ArrayBuffer,
): AudioBuffer {
  const view = new DataView(pcmBuffer);
  const samples = pcmBuffer.byteLength / 2;
  const audioBuffer = audioContext.createBuffer(1, samples, PCM_SAMPLE_RATE);
  const channel = audioBuffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    channel[i] = view.getInt16(i * 2, true) / 32768;
  }
  return audioBuffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function audioBuffersToWav(buffers: AudioBuffer[]): ArrayBuffer {
  const sampleRate = buffers[0]?.sampleRate ?? PCM_SAMPLE_RATE;
  const numChannels = 1;
  const bytesPerSample = 2;
  let totalSamples = 0;
  for (const buf of buffers) totalSamples += buf.length;
  const dataSize = totalSamples * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (const buf of buffers) {
    const channel = buf.getChannelData(0);
    for (let i = 0; i < channel.length; i++) {
      const s = Math.max(-1, Math.min(1, channel[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return arrayBuffer;
}

function createAudioContext(): AudioContext {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  try {
    return new Ctor({ sampleRate: PCM_SAMPLE_RATE });
  } catch {
    return new Ctor();
  }
}

export default function Page() {
  const configText = useConfig().voice.text;
  const [text, setText] = useState(configText.defaultText);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<AudioBuffer[]>([]);
  const scheduledCountRef = useRef(0);
  const nextStartTimeRef = useRef(0);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const isPlayingRef = useRef(false);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      for (const node of sourceNodesRef.current) {
        try {
          node.stop();
        } catch {}
      }
      audioContextRef.current?.close();
    };
  }, []);

  const stopPlayback = () => {
    for (const node of sourceNodesRef.current) {
      try {
        node.stop();
      } catch {}
      try {
        node.disconnect();
      } catch {}
    }
    sourceNodesRef.current = [];
    scheduledCountRef.current = 0;
    nextStartTimeRef.current = 0;
    isPlayingRef.current = false;
    setIsPlaying(false);
  };

  const schedulePendingChunks = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    const chunks = chunksRef.current;
    while (scheduledCountRef.current < chunks.length) {
      const buffer = chunks[scheduledCountRef.current];
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;
      source.onended = () => {
        const idx = sourceNodesRef.current.indexOf(source);
        if (idx >= 0) sourceNodesRef.current.splice(idx, 1);
        if (
          sourceNodesRef.current.length === 0 &&
          !isGeneratingRef.current &&
          scheduledCountRef.current === chunksRef.current.length
        ) {
          scheduledCountRef.current = 0;
          nextStartTimeRef.current = 0;
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      };
      sourceNodesRef.current.push(source);
      scheduledCountRef.current++;
    }
  };

  const handleGenerate = () => {
    if (isGeneratingRef.current) return;
    if (!text.trim()) return;

    stopPlayback();
    chunksRef.current = [];
    setCanPlay(false);
    isGeneratingRef.current = true;
    setIsGenerating(true);

    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      audioContextRef.current = createAudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    const ws = new WebSocket(TTS_URL);
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "session.config", ...SESSION_CONFIG }));
      ws.send(JSON.stringify({ type: "input.text", text }));
      ws.send(JSON.stringify({ type: "input.done" }));
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        const audioBuffer = pcmToAudioBuffer(ctx, event.data);
        chunksRef.current.push(audioBuffer);
        if (chunksRef.current.length === 1) {
          setCanPlay(true);
        }
        if (isPlayingRef.current) {
          schedulePendingChunks();
        }
        return;
      }
      if (typeof event.data !== "string") return;
      let msg: TtsFrame;
      try {
        msg = JSON.parse(event.data) as TtsFrame;
      } catch {
        return;
      }
      if (msg.type === "audio.chunk" && msg.audio_b64) {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        const pcm = decodeBase64(msg.audio_b64);
        const audioBuffer = pcmToAudioBuffer(ctx, pcm);
        chunksRef.current.push(audioBuffer);
        if (chunksRef.current.length === 1) {
          setCanPlay(true);
        }
        if (isPlayingRef.current) {
          schedulePendingChunks();
        }
      } else if (msg.type === "session.done") {
        isGeneratingRef.current = false;
        setIsGenerating(false);
        ws.close();
        wsRef.current = null;
      } else if (msg.type === "error") {
        isGeneratingRef.current = false;
        setIsGenerating(false);
        ws.close();
        wsRef.current = null;
      }
    };

    ws.onerror = () => {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    };
  };

  const handlePlay = () => {
    if (!canPlay || isPlayingRef.current) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    isPlayingRef.current = true;
    setIsPlaying(true);
    schedulePendingChunks();
  };

  const handleDownload = () => {
    if (chunksRef.current.length === 0) return;
    const wav = audioBuffersToWav(chunksRef.current);
    const blob = new Blob([wav], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PhiLia093-TTS.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-dvh w-dvw flex flex-col">
      <Navigator />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl flex flex-col sm:flex-row sm:items-center gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={configText.placeholderText}
            className="flex-1 w-full h-32 sm:h-40 px-4 py-2 rounded bg-neutral-800 text-neutral-100 outline-none border border-neutral-700 focus:border-pink resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <div className="flex sm:flex-col gap-2 sm:self-stretch">
            <button
              onClick={handlePlay}
              disabled={!canPlay || isPlaying}
              className="flex-1 min-w-0 sm:min-w-36 px-4 py-2 rounded bg-pink text-neutral-900 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {isPlaying ? configText.playingText : configText.playText}
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 min-w-0 sm:min-w-36 px-4 py-2 rounded bg-neutral-100 text-neutral-900 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {isGenerating
                ? configText.generatingText
                : configText.generateText}
            </button>
            <button
              onClick={handleDownload}
              disabled={!canPlay || isGenerating}
              className="flex-1 min-w-0 sm:min-w-36 px-4 py-2 rounded bg-neutral-100 text-neutral-900 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {configText.downloadText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
