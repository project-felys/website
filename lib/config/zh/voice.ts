import type { VoiceConfig } from "../types";

export const voice: VoiceConfig = {
  namespace: "语音",
  route: "voice",
  text: {
    defaultText: "伙伴，不可以用于商业或非法用途。欢迎分享，我会很开心的哦。",
    language: "Auto",
    placeholderText: "想听她说些什么呢？",
    playText: "播放",
    pauseText: "暂停",
    generateText: "生成",
    historyText: "历史记录（点击可回放）",
    noHistoryText: "无记录",
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
  },
};
