import type { VoiceConfig } from "@/lib/config/types";

export const VOICE: VoiceConfig = {
  namespace: "Voice",
  route: "voice",
  text: {
    defaultText:
      "Not for commercial or illegal use. Feel free to share, she'd be really happy.",
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
      Disclaimer:
        "This model is based on Qwen3-TTS and fine-tuned using only Honkai: Star Rail assets. Any misuse is the sole responsibility of the user.",
      Tips: "Punctuation affects tone and phrasing, and pinyin is supported. Each generation uses a different seed, so try the same sentence several times. Language defaults to auto; picking a specific language only makes the audio closer to its pronunciation rather than switching languages automatically, and it reduces expressiveness.",
    },
  },
};
