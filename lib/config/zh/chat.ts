import type { ChatConfig } from "../types";

export const chat: ChatConfig = {
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
        "模型部署在个人硬件，通过内网穿透对外提供无状态服务，不会记录任何对话内容。",
      提示: "当前模型因严重过拟合已废弃，后续将使用新模型替代，敬请期待。",
    },
  },
};
