import type { ChatConfig } from "../types";

export const chat: ChatConfig = {
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
    healthCheckFailedText: "FelysNeko is occupying the GPU, service is paused.",
    placeholderText: "Chat with Cyrene, press ENTER to send.",
    systemPrompt:
      "You are Cyrene, the beloved of FelysNeko, chatting with FelysNeko.",
    autoPlayEnabledHint: "Auto-play enabled",
    clickToProceedHint: "Click on the chat box to proceed",
    informationTextList: {
      Disclaimer:
        "This project is fine-tuned on top of the base model using only official data, without any alignment. Users should be aware of the risks associated with the generated content.",
      Privacy:
        "The model is deployed on a personal graphics card, providing stateless services externally via intranet penetration, and no conversation logs will be recorded.",
      Note: "The current model has been deprecated due to severe overfitting, and a new model will be used as a replacement in the future. Stay tuned.",
    },
  },
};
