import { TTS_SOCKET_URL } from "@/lib/config/endpoints";

export type TtsSessionConfig = {
  speaker: string;
  task_type: string;
  language: string;
  response_format: string;
  stream_audio: boolean;
  seed: number;
  initial_codec_chunk_frames: number;
  extra_params: { temperature: number };
};

type TtsServerMessage =
  | { type: "audio.chunk"; audio_b64?: string }
  | { type: "session.done" }
  | { type: "error"; message?: string };

export function makeRandomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

function decodeBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function pcmToFloats(pcm: ArrayBuffer): Float32Array {
  const view = new DataView(pcm);
  const floats = new Float32Array(pcm.byteLength / 2);
  for (let i = 0; i < floats.length; i++) {
    floats[i] = view.getInt16(i * 2, true) / 32768;
  }
  return floats;
}

function parseFrame(raw: string): TtsServerMessage | null {
  try {
    return JSON.parse(raw) as TtsServerMessage;
  } catch {
    return null;
  }
}

export function openTtsSource(
  text: string,
  session: TtsSessionConfig,
): ReadableStream<Float32Array> {
  let ws: WebSocket | null = null;
  let isEnded = false;

  const close = () => ws?.close();

  const fail = (
    controller: ReadableStreamDefaultController<Float32Array>,
    message: string,
  ) => {
    if (isEnded) return;
    isEnded = true;
    controller.error(new Error(message));
    close();
  };

  return new ReadableStream({
    start(controller) {
      ws = new WebSocket(TTS_SOCKET_URL);
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        if (isEnded) return;
        ws?.send(
          JSON.stringify({
            type: "session.config",
            ...session,
          }),
        );
        ws?.send(JSON.stringify({ type: "input.text", text }));
        ws?.send(JSON.stringify({ type: "input.done" }));
      };

      ws.onmessage = (event) => {
        if (isEnded) return;

        if (event.data instanceof ArrayBuffer) {
          controller.enqueue(pcmToFloats(event.data));
          return;
        }
        if (typeof event.data !== "string") return;

        const message = parseFrame(event.data);
        if (!message) return;

        switch (message.type) {
          case "audio.chunk":
            if (message.audio_b64) {
              controller.enqueue(pcmToFloats(decodeBase64(message.audio_b64)));
            }
            break;
          case "session.done":
            isEnded = true;
            controller.close();
            close();
            break;
          case "error":
            fail(controller, message.message ?? "tts error");
            break;
        }
      };

      ws.onerror = () => fail(controller, "websocket error");
      ws.onclose = () => {
        if (!isEnded) {
          isEnded = true;
          controller.error(new Error("websocket closed unexpectedly"));
        }
      };
    },
    cancel() {
      close();
    },
  });
}
