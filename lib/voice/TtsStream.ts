export const TTS_URL = "wss://tunnel.felys.dev/v1/audio/speech/stream";

export type TtsSessionConfig = {
  speaker: string;
  task_type: string;
  language: string;
  response_format: string;
  stream_audio: boolean;
  initial_codec_chunk_frames?: number;
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

export type TtsStreamCallbacks = {
  onChunk?: (frames: Float32Array) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
};

export function parseTtsFrame(raw: string): TtsFrame | null {
  try {
    return JSON.parse(raw) as TtsFrame;
  } catch {
    return null;
  }
}

export function decodeBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function pcmToFloats(pcm: ArrayBuffer): Float32Array {
  const view = new DataView(pcm);
  const samples = pcm.byteLength / 2;
  const floats = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    floats[i] = view.getInt16(i * 2, true) / 32768;
  }
  return floats;
}

export class TtsStreamClient {
  private ws: WebSocket | null = null;

  constructor(private readonly callbacks: TtsStreamCallbacks) {}

  get isGenerating(): boolean {
    return this.ws !== null;
  }

  generate(text: string, session: TtsSessionConfig): void {
    if (!text.trim()) return;
    this.close();

    const ws = new WebSocket(TTS_URL);
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
      this.callbacks.onError?.("websocket error");
    };

    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
    };
  }

  close(): void {
    const ws = this.ws;
    this.ws = null;
    ws?.close();
  }

  private handleMessage(data: unknown): void {
    if (data instanceof ArrayBuffer) {
      this.callbacks.onChunk?.(pcmToFloats(data));
      return;
    }
    if (typeof data !== "string") return;

    const msg = parseTtsFrame(data);
    if (!msg) return;

    switch (msg.type) {
      case "audio.chunk":
        if (msg.audio_b64) {
          this.callbacks.onChunk?.(pcmToFloats(decodeBase64(msg.audio_b64)));
        }
        break;
      case "session.done":
        this.callbacks.onDone?.();
        this.close();
        break;
      case "error":
        this.callbacks.onError?.(msg.message);
        this.callbacks.onDone?.();
        this.close();
        break;
    }
  }
}
