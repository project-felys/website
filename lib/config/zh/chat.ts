import type { ChatConfig } from "@/lib/config/types";

export const CHAT: ChatConfig = {
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
    systemPrompt: "昔涟，正陪银河猫猫侠聊天。",
    informationTextList: {
      免责声明:
        "本模型基于 Qwen3.5，仅使用《崩坏：星穹铁道》资产进行微调，任何滥用请向使用者追究全部责任。",
      偏置: "玩家身份为「星」，昵称是「银河猫猫侠」，而「昔涟」的认知范围以「翁法罗斯」为主。",
    },
  },
};
