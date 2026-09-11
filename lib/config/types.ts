export type Locale = "en" | "zh";

export type Config = {
  root: Locale;
  title: string;
  subTitle: string;
  compiler: CompilerConfig;
  chat: ChatConfig;
  voice: VoiceConfig;
  articleNamespace: string;
};

type ConfigEntry<T> = {
  namespace: string;
  route: string;
  text: T;
};

export type CompilerText = {
  runningOn: string;
};

export type ChatText = {
  systemName: string;
  userName: string;
  cyreneName: string;
  healthCheckingText: string;
  sendingMessageText: string;
  failedToSendMessageText: string;
  healthCheckFailedText: string;
  waitingForReplyText: string;
  placeholderText: string;
  systemPrompt: string;
  clickToProceedHint: string;
  informationTextList: Record<string, string>;
};

export type VoiceText = {
  defaultText: string;
  language: string;
  placeholderText: string;
  playText: string;
  pauseText: string;
  generateText: string;
  historyText: string;
  noHistoryText: string;
  healthCheckingText: string;
  healthCheckFailedText: string;
  defaultSpeaker: string;
  speakers: Record<string, string>;
};

export type CompilerConfig = ConfigEntry<CompilerText>;
export type ChatConfig = ConfigEntry<ChatText>;
export type VoiceConfig = ConfigEntry<VoiceText>;
