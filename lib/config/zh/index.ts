import type { Config } from "@/lib/config/types";
import { CHAT } from "@/lib/config/zh/chat";
import { COMPILER } from "@/lib/config/zh/compiler";
import { VOICE } from "@/lib/config/zh/voice";

// `root` is kept as a literal so `LOCALES` can check it against its own key.
export const ZH: Config & { root: "zh" } = {
  root: "zh",
  title: "欢迎来到 Felys\xA0项目\u2060",
  subTitle: "致爱莉希雅与昔涟",
  compiler: COMPILER,
  chat: CHAT,
  voice: VOICE,
  articleNamespace: "文章",
};
