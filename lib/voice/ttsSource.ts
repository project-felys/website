import { TTS_SPEECH_URL } from "@/lib/config/endpoints";

export type TtsSessionConfig = {
  speaker: string;
  task_type: string;
  language: string;
  response_format: string;
  stream: boolean;
  stream_format: string;
  initial_codec_chunk_frames: number;
};

function pcmToFloats(bytes: Uint8Array): Float32Array {
  const floats = new Float32Array(bytes.byteLength / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < floats.length; i++) {
    floats[i] = view.getInt16(i * 2, true) / 32768;
  }
  return floats;
}

export function openTtsSource(
  text: string,
  session: TtsSessionConfig,
): ReadableStream<Float32Array> {
  let abort: AbortController | null = null;

  return new ReadableStream({
    async start(controller) {
      abort = new AbortController();
      try {
        const response = await fetch(TTS_SPEECH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: text, ...session }),
          signal: abort.signal,
        });
        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => "");
          controller.error(new Error(detail || `tts http ${response.status}`));
          return;
        }

        const reader = response.body.getReader();
        // A chunk boundary may split a 2-byte PCM sample; carry the remainder.
        let pending: Uint8Array | null = null;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          let chunk = value;
          if (pending) {
            const merged = new Uint8Array(pending.length + chunk.length);
            merged.set(pending);
            merged.set(chunk, pending.length);
            chunk = merged;
            pending = null;
          }
          const usable = chunk.byteLength - (chunk.byteLength % 2);
          if (usable < chunk.byteLength) pending = chunk.slice(usable);
          if (usable > 0) controller.enqueue(pcmToFloats(chunk.subarray(0, usable)));
        }
        controller.close();
      } catch (error) {
        if (abort.signal.aborted) return;
        controller.error(
          error instanceof Error ? error : new Error("tts fetch failed"),
        );
      }
    },
    cancel() {
      abort?.abort();
    },
  });
}
