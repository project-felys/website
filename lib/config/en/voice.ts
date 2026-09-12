import type { VoiceConfig } from "@/lib/config/types";

export const VOICE: VoiceConfig = {
  namespace: "Voice",
  route: "voice",
  text: {
    defaultText:
      "Do not use for commercial or illegal purposes. The model is trained only on the Chinese voiceover audio.",
    defaultLanguage: "auto",
    placeholderText: "What would you like to hear from her?",
    playText: "Play",
    pauseText: "Pause",
    generateText: "Generate",
    historyText: "History (click to replay)",
    healthCheckingText: "Connecting to the voice service...",
    healthCheckFailedText:
      "FelysNeko is occupying the hardware, service is paused.",
    defaultSpeaker: "cyrene/chinese(prc)",
    speakers: {
      "cyrene/chinese(prc)": "Cyrene",
      "aglaea/chinese(prc)": "Aglaea",
      "hysilens/chinese(prc)": "Hysilens",
      "hyacine/chinese(prc)": "Hyacine",
      "castorice/chinese(prc)": "Castorice",
      "cipher/chinese(prc)": "Cipher",
      "cerydra/chinese(prc)": "Cerydra",
    },
    languages: {
      auto: "Auto",
      chinese: "Chinese",
      english: "English",
      japanese: "Japanese",
      korean: "Korean",
      german: "German",
      french: "French",
      russian: "Russian",
      portuguese: "Portuguese",
      spanish: "Spanish",
      italian: "Italian",
    },
    informationTextList: {
      Privacy:
        "The model runs on personal hardware and is exposed as a stateless service through a tunnel. No conversation content is recorded.",
    },
  },
};
