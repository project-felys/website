export interface ConfigProps {
  config: Config;
}

export type Config = {
  root: string;
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

type ChatConfig = ConfigEntry<{
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
  autoPlayEnabledHint: string;
  clickToProceedHint: string;
  informationTextList: Record<string, string>;
}>;

type VoiceConfig = ConfigEntry<{
  defaultText: string;
  placeholderText: string;
  playText: string;
  playingText: string;
  generateText: string;
  generatingText: string;
  downloadText: string;
}>;

type CompilerConfig = ConfigEntry<{ runningOn: string }>;

export const ZH: Config = {
  root: "zh",
  title: "欢迎来到 Felys\xA0项\u2060目",
  subTitle: "致爱莉希雅与昔涟",
  compiler: {
    namespace: "编译器",
    route: "compiler",
    text: { runningOn: "运行在" },
  },
  chat: {
    namespace: "聊天",
    route: "chat",
    text: {
      systemName: "δ-me13",
      userName: "银河猫猫侠",
      cyreneName: "昔涟",
      healthCheckingText: "连接翁法罗斯万帷网中……",
      sendingMessageText: "消息发送中……",
      waitingForReplyText: "昔涟正在输入中……",
      failedToSendMessageText: "发送失败，请稍后重试。",
      healthCheckFailedText: "银河猫猫侠正在占用显卡中，服务暂停。",
      placeholderText: "陪昔涟聊聊天吧，按「回车」发送消息。",
      systemPrompt: "你是银河猫猫侠深爱的昔涟，正陪着她聊天。",
      autoPlayEnabledHint: "已启用自动播放",
      clickToProceedHint: "点击对话框继续",
      informationTextList: {
        免责声明:
          "本项目仅使用官方文本对大语言模型微调，未经任何对齐，使用者需自行承担由生成内容引发的风险。",
        隐私政策:
          "模型部署在自用显卡，通过内网穿透对外提供无状态服务，不会记录任何对话内容。",
        提示: "当回复文本透明度下降的时候，说明内容脱离了训练数据分布，或者是期望输出内容被基座模型（千问3.5-4B-Base）抑制，导致模型开始复读或者幻觉。",
      },
    },
  },
  voice: {
    namespace: "语音",
    route: "voice",
    text: {
      defaultText: "不要用于商业或非法用途哦～欢迎分享，昔涟会很开心的♪",
      placeholderText: "输入要合成的文本……",
      playText: "播放",
      playingText: "播放中",
      generateText: "生成",
      generatingText: "生成中",
      downloadText: "下载",
    },
  },
  articleNamespace: "文章",
};

export const EN: Config = {
  root: "en",
  title: "Welcome to the Felys\xA0project",
  subTitle: "To Elysia and Cyrene",
  compiler: {
    namespace: "Compiler",
    route: "compiler",
    text: { runningOn: "on" },
  },
  chat: {
    namespace: "Chat",
    route: "chat",
    text: {
      systemName: "δ-me13",
      userName: "FelysNeko",
      cyreneName: "Cyrene",
      healthCheckingText: "Connecting to Amphoreus World Wound Web...",
      sendingMessageText: "Sending message...",
      waitingForReplyText: "Cyrene is typing...",
      failedToSendMessageText:
        "Failed to send the message, please retry later.",
      healthCheckFailedText:
        "FelysNeko is occupying the GPU, service is paused.",
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
        Note: "A drop in response text opacity means the content is out of distribution or the expected output is suppressed by the base model (Qwen3.5-4B-Base), causing repetition or hallucination.",
      },
    },
  },
  voice: {
    namespace: "Voice",
    route: "voice",
    text: {
      defaultText:
        "Do not use for commercial or illegal purposes. The model is only trained on Chinese voice actor of Cyrene.",
      placeholderText: "Enter text to synthesize...",
      playText: "Play",
      playingText: "Playing",
      generateText: "Generate",
      generatingText: "Generating",
      downloadText: "Download",
    },
  },
  articleNamespace: "Articles",
};
