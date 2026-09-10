import type { VoiceConfig } from "@/lib/config/types";

export const VOICE: VoiceConfig = {
  namespace: "Voice",
  route: "voice",
  text: {
    defaultText:
      "Do not use for commercial or illegal purposes. The model is trained only on the Chinese voiceover audio.",
    language: "Auto",
    placeholderText: "What would you like to hear from her?",
    playText: "Play",
    pauseText: "Pause",
    generateText: "Generate",
    historyText: "History (click to replay)",
    noHistoryText: "No records",
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
  },
};
