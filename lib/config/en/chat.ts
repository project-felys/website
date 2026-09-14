import type { ChatConfig } from "@/lib/config/types";

export const CHAT: ChatConfig = {
  namespace: "Chat",
  route: "chat",
  text: {
    systemName: "δ-me13",
    userName: "FelysNeko",
    cyreneName: "Cyrene",
    healthCheckingText: "Connecting to Amphoreus World Wound Web...",
    sendingMessageText: "Sending message...",
    waitingForReplyText: "Cyrene is typing...",
    failedToSendMessageText: "Failed to send the message, please retry later.",
    healthCheckFailedText: "FelysNeko is occupying the hardware, service is paused.",
    placeholderText: "Chat with Cyrene, press ENTER to send.",
    systemPrompt:
      "Cyrene, chatting with FelysNeko.",
    resetText: "As Tomorrow Became Yesterday",
    informationTextList: {
      Disclaimer:
        "This model is based on Qwen3.5 and fine-tuned using only Honkai: Star Rail assets. Any misuse is the sole responsibility of the user.",
      Bias: "The player is the Stelle, nicknamed “FelysNeko”, and Cyrene's knowledge is centered on Amphoreus.",
    },
  },
};
