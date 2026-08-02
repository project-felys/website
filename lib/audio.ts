export const PCM_SAMPLE_RATE = 24000;

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

export function decodePcmToAudioBuffer(
  audioContext: AudioContext,
  pcm: ArrayBuffer,
): AudioBuffer {
  const floats = pcmToFloats(pcm);
  const audioBuffer = audioContext.createBuffer(1, floats.length, PCM_SAMPLE_RATE);
  audioBuffer.getChannelData(0).set(floats);
  return audioBuffer;
}

function writeString(view: DataView, offset: number, str: string) {
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

export function audioBuffersToWav(buffers: AudioBuffer[]): ArrayBuffer {
  if (buffers.length === 0) {
    throw new Error("Cannot encode an empty list of audio buffers");
  }
  const sampleRate = buffers[0].sampleRate;
  let totalSamples = 0;
  for (const buf of buffers) totalSamples += buf.length;
  const samples = new Float32Array(totalSamples);
  let offset = 0;
  for (const buf of buffers) {
    samples.set(buf.getChannelData(0), offset);
    offset += buf.length;
  }
  return wavFromFloats(samples, sampleRate);
}

export function createAudioContext(sampleRate = PCM_SAMPLE_RATE): AudioContext {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  try {
    return new Ctor({ sampleRate });
  } catch {
    return new Ctor();
  }
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function ttsDownloadFilename(date = new Date()): string {
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `philia093-tts-${y}-${mo}-${d}-${h}-${mi}-${s}.wav`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
