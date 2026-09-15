import type { VoiceConfig } from "@/lib/config/types";

export const VOICE: VoiceConfig = {
  namespace: "语音",
  route: "voice",
  text: {
    defaultText: "不可以用于商业或非法用途。欢迎分享，人家会很开心的哦。",
    defaultLanguage: "auto",
    placeholderText: "想听她说些什么呢？",
    playText: "播放",
    pauseText: "暂停",
    generateText: "生成",
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
      auto: "自动",
      chinese: "中文",
      english: "英文",
      japanese: "日文",
      korean: "韩文",
      german: "德文",
      french: "法文",
      russian: "俄文",
      portuguese: "葡萄牙文",
      spanish: "西班牙文",
      italian: "意大利文",
    },
    informationTextList: {
      免责声明:
        "本模型基于 Qwen3-TTS，仅使用《崩坏：星穹铁道》资产进行微调，任何滥用请向使用者追究全部责任。",
      小贴士:
        "标点符号会影响语气和断句，支持拼音。每次生成都会使用不同的种子，推荐一句话多尝试几次。语言默认为自动，选择具体语言只会让音频更贴合其发音，而不是自动切换语言，并且会降低表现力。",
    },
  },
};
