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
    playingText: "Playing",
    generateText: "Generate",
    generatingText: "Generating",
    downloadText: "Download",
    betaNotice:
      "Note: Currently in beta; the model is deployed on a personal graphics card.",
  },
};
