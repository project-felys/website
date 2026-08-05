import { AudioStream } from "./AudioStream";
import { PLAYER_SAMPLE_RATE } from "./PlayerEngine";
import { hashText } from "./hash";

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function wavFromFloats(
  samples: Float32Array,
  sampleRate: number,
  numChannels = 1,
): ArrayBuffer {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
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
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return arrayBuffer;
}

export function audioStreamToWav(stream: AudioStream): ArrayBuffer {
  const total = stream.length;
  const samples = new Float32Array(total);
  let offset = 0;
  while (offset < total) {
    const piece = stream.readAt(offset, total - offset);
    if (!piece) break;
    samples.set(piece, offset);
    offset += piece.length;
  }
  return wavFromFloats(samples, PLAYER_SAMPLE_RATE);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function ttsDownloadFilename(text: string, date = new Date()): string {
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${hashText(text)}-${y}-${mo}-${d}T${h}-${mi}-${s}.wav`;
}

export function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
}

export function formatDuration(frames: number): string {
  const totalSeconds = Math.floor(frames / PLAYER_SAMPLE_RATE);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${pad(s)}`;
}
