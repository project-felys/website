export interface ConfigProps {
  config: Config;
}

export type Config = {
  root: string;
  title: string;
  subTitle: string;
  compiler: CompilerConfig;
  chat: ChatConfig;
  portfolio: PortfolioConfig;
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

type PortfolioConfig = ConfigEntry<{}>;

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
      systemPrompt: "你是银河猫猫侠深爱的昔涟，在和银河猫猫侠聊天。",
      autoPlayEnabledHint: "已启用自动播放",
      clickToProceedHint: "点击对话框继续",
      informationTextList: {
        免责声明:
          "本项目仅使用官方文本对大语言模型微调，未经任何对齐，使用者需自行承担由生成内容引发的风险。",
        隐私政策:
          "模型部署在自用显卡，通过内网穿透对外提供无状态服务，不会记录任何对话内容。",
        提示: "提示词已经锚定了身份，但是依然建议称呼她的名字（比如：昔涟、迷迷、德谬歌）来收敛身份认知。如果聊天逻辑跳跃，说明聊天内容已经脱离训练数据分布，或者是触发了基座模型（Qwen3.5-4B）的安全对齐。如果出现复读，说明模型不确定怎么回复。",
      },
    },
  },
  portfolio: {
    namespace: "作品集",
    route: "portfolio",
    text: {},
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
        Note: "The prompt has already anchored the identity, but it is still recommended to address her by her name (e.g., Cryene, Mem, Demiurge) to narrow down identity recognition. If the conversation logic jumps, it indicates that the conversation content has deviated from the training data distribution, or has triggered the safety alignment of the base model (Qwen3.5-4B). If repetition occurs, it means the model is unsure how to respond.",
      },
    },
  },
  portfolio: {
    namespace: "Portfolio",
    route: "portfolio",
    text: {},
  },
  articleNamespace: "Articles",
};
