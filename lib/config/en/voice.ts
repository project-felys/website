import type { VoiceConfig } from "../types";

export const voice: VoiceConfig = {
  namespace: "Voice",
  route: "voice",
  text: {
    defaultText:
      "Do not use for commercial or illegal purposes. The model is trained only on the Chinese voice-over audio for Cyrene.",
    language: "English",
    placeholderText: "Enter text to synthesize...",
    playText: "Play",
    pauseText: "Pause",
    playingText: "Playing",
    generateText: "Generate",
    generatingText: "Generating",
    downloadText: "Download",
    historyText: "History (click to replay)",
    noHistoryText: "No records",
    notice: "Model deployed on a personal GPU",
  },
};
