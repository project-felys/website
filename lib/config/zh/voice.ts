import type { VoiceConfig } from "../types";

export const voice: VoiceConfig = {
  namespace: "语音",
  route: "voice",
  text: {
    defaultText: "伙伴，不可以用于商业或非法用途。欢迎分享，昔涟会很开心的哦♪",
    language: "Chinese",
    placeholderText: "输入要合成的文本……",
    playText: "播放",
    pauseText: "暂停",
    playingText: "播放中",
    generateText: "生成",
    generatingText: "生成中",
    downloadText: "下载",
    historyText: "历史记录（点击可回放）",
    noHistoryText: "无记录",
    notice: "模型部署在自用显卡",
  },
};
