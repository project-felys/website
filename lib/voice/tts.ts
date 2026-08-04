import {
  PCM_SAMPLE_RATE,
  audioBuffersToWav,
  createAudioContext,
  decodeBase64,
  decodePcmToAudioBuffer,
} from "./audio";

export const TTS_URL = "wss://tunnel.felys.dev/v1/audio/speech/stream";

export type TtsSessionConfig = {
  speaker: string;
  task_type: string;
  language: string;
  response_format: string;
  stream_audio: boolean;
};

export type TtsFrame =
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

export type TtsState = {
  canPlay: boolean;
  isPlaying: boolean;
  isGenerating: boolean;
};

export type TtsCallbacks = {
  onStateChange?: (state: TtsState) => void;
  onError?: (message: string) => void;
};

export type TtsDeps = {
  url?: string;
  createWebSocket?: (url: string) => WebSocket;
  createAudioContext?: () => AudioContext;
};

export function parseTtsFrame(raw: string): TtsFrame | null {
  try {
    return JSON.parse(raw) as TtsFrame;
  } catch {
    return null;
  }
}

export class TtsClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private chunks: AudioBuffer[] = [];
  private scheduledCount = 0;
  private nextStartTime = 0;
  private sourceNodes: AudioBufferSourceNode[] = [];
  private state: TtsState = {
    canPlay: false,
    isPlaying: false,
    isGenerating: false,
  };
  private readonly deps: Required<TtsDeps>;
  private readonly callbacks: TtsCallbacks;

  constructor(deps: TtsDeps = {}, callbacks: TtsCallbacks = {}) {
    this.deps = {
      url: TTS_URL,
      createWebSocket: (url) => new WebSocket(url),
      createAudioContext: () => createAudioContext(PCM_SAMPLE_RATE),
      ...deps,
    };
    this.callbacks = callbacks;
  }

  get canPlay(): boolean {
    return this.state.canPlay;
  }

  get isPlaying(): boolean {
    return this.state.isPlaying;
  }

  get isGenerating(): boolean {
    return this.state.isGenerating;
  }

  generate(text: string, session: TtsSessionConfig): void {
    if (this.state.isGenerating) return;
    if (!text.trim()) return;

    this.stop();
    this.chunks = [];
    this.setState({ canPlay: false, isGenerating: true });

    this.ensureAudioContext();

    const ws = this.deps.createWebSocket(this.deps.url);
    this.ws = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "session.config", ...session }));
      ws.send(JSON.stringify({ type: "input.text", text }));
      ws.send(JSON.stringify({ type: "input.done" }));
    };

    ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    ws.onerror = () => {
      this.setState({ isGenerating: false });
    };

    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
    };
  }

  play(): void {
    if (!this.state.canPlay || this.state.isPlaying) return;
    const ctx = this.audioContext;
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    this.setState({ isPlaying: true });
    this.schedulePendingChunks();
  }

  stop(): void {
    for (const node of this.sourceNodes) {
      try {
        node.stop();
      } catch {}
      try {
        node.disconnect();
      } catch {}
    }
    this.sourceNodes = [];
    this.scheduledCount = 0;
    this.nextStartTime = 0;
    this.setState({ isPlaying: false });
  }

  toWav(): ArrayBuffer | null {
    if (this.chunks.length === 0) return null;
    return audioBuffersToWav(this.chunks);
  }

  private endSession(): void {
    this.setState({ isGenerating: false });
    const ws = this.ws;
    this.ws = null;
    ws?.close();
  }

  close(): void {
    const ws = this.ws;
    this.ws = null;
    ws?.close();
    this.stop();
    this.audioContext?.close();
    this.audioContext = null;
  }

  private setState(patch: Partial<TtsState>): void {
    const next = { ...this.state, ...patch };
    if (
      next.canPlay === this.state.canPlay &&
      next.isPlaying === this.state.isPlaying &&
      next.isGenerating === this.state.isGenerating
    ) {
      return;
    }
    this.state = next;
    this.callbacks.onStateChange?.(next);
  }

  private ensureAudioContext(): void {
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = this.deps.createAudioContext();
    }
    if (this.audioContext.state === "suspended") {
      void this.audioContext.resume();
    }
  }

  private handleMessage(data: unknown): void {
    if (data instanceof ArrayBuffer) {
      this.pushChunk(data);
      return;
    }
    if (typeof data !== "string") return;

    const msg = parseTtsFrame(data);
    if (!msg) return;

    switch (msg.type) {
      case "audio.chunk":
        if (msg.audio_b64) {
          this.pushChunk(decodeBase64(msg.audio_b64));
        }
        break;
      case "session.done":
      case "error":
        this.endSession();
        break;
    }
  }

  private pushChunk(pcm: ArrayBuffer): void {
    const ctx = this.audioContext;
    if (!ctx) return;
    this.chunks.push(decodePcmToAudioBuffer(ctx, pcm));
    if (this.chunks.length === 1) {
      this.setState({ canPlay: true });
    }
    if (this.state.isPlaying) {
      this.schedulePendingChunks();
    }
  }

  private schedulePendingChunks(): void {
    const ctx = this.audioContext;
    if (!ctx) return;
    while (this.scheduledCount < this.chunks.length) {
      const buffer = this.chunks[this.scheduledCount];
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      const startTime = Math.max(this.nextStartTime, ctx.currentTime);
      source.start(startTime);
      this.nextStartTime = startTime + buffer.duration;
      source.onended = () => this.onSourceEnded(source);
      this.sourceNodes.push(source);
      this.scheduledCount++;
    }
  }

  private onSourceEnded(source: AudioBufferSourceNode): void {
    const idx = this.sourceNodes.indexOf(source);
    if (idx >= 0) this.sourceNodes.splice(idx, 1);
    if (
      this.sourceNodes.length === 0 &&
      !this.state.isGenerating &&
      this.scheduledCount === this.chunks.length
    ) {
      this.scheduledCount = 0;
      this.nextStartTime = 0;
      this.setState({ isPlaying: false });
    }
  }
}
