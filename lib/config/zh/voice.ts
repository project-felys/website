import type { VoiceConfig } from "@/lib/config/types";

export const VOICE: VoiceConfig = {
  namespace: "语音",
  route: "voice",
  text: {
    defaultText: "不可以用于商业或非法用途。欢迎分享，人家会很开心的哦。",
    defaultLanguage: "Auto",
    placeholderText: "想听她说些什么呢？",
    playText: "播放",
    pauseText: "暂停",
    generateText: "生成",
    historyText: "历史记录（点击可回放）",
    healthCheckingText: "正在连接语音服务中……",
    healthCheckFailedText: "银河猫猫侠正在占用显卡中，服务暂停。",
    defaultSpeaker: "cyrene/chinese(prc)",
    speakers: {
      "cyrene/chinese(prc)": "昔涟",
      "aglaea/chinese(prc)": "阿格莱雅",
      "hysilens/chinese(prc)": "海瑟音",
      "hyacine/chinese(prc)": "风堇",
      "castorice/chinese(prc)": "遐蝶",
      "cipher/chinese(prc)": "赛飞儿",
      "cerydra/chinese(prc)": "刻律德菈",
    },
    languages: {
      Auto: "自动",
      Chinese: "中文",
      English: "英文",
      Japanese: "日文",
      Korean: "韩文",
      German: "德文",
      French: "法文",
      Russian: "俄文",
      Portuguese: "葡萄牙文",
      Spanish: "西班牙文",
      Italian: "意大利文",
    },
    informationTextList: {
      "隐私政策":
        "模型部署在个人硬件，通过内网穿透对外提供无状态服务，不会记录任何对话内容。",
    },
  },
};
