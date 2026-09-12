import { hashText } from "@/lib/voice/hash";
import { PCM_SAMPLE_RATE } from "@/lib/voice/pcmPlayer";

/** Zero-pads a clock component, so `7` becomes `"07"`. */
function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Wall-clock label for a history entry. */
export function formatClock(date: Date): string {
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
}

/** Playback position as `m:ss`. */
export function formatDuration(frames: number): string {
  const totalSeconds = Math.floor(frames / PCM_SAMPLE_RATE);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${pad(seconds)}`;
}

/** Seed as a fixed-width hex label, e.g. `0x0af21b3c`. */
export function formatSeed(seed: number): string {
  return `0x${seed.toString(16).padStart(8, "0")}`;
}

/**
 * Download name for a synthesized clip, derived from its speaker, language,
 * seed, text and timestamp.
 */
export function makeTtsFilename(
  text: string,
  speaker: string,
  language: string,
  seed: number,
  date = new Date(),
): string {
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  const speakerName = speaker.replaceAll("/", "-");
  return `${speakerName}-${language}-${seed}-${hashText(text)}-${y}-${mo}-${d}T${h}-${mi}-${s}.wav`;
}
