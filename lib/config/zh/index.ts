import type { Config } from "../types";
import { compiler } from "./compiler";
import { chat } from "./chat";
import { voice } from "./voice";

// `root` is kept as a literal so `LOCALES` can check it against its own key.
export const ZH: Config & { root: "zh" } = {
  root: "zh",
  title: "欢迎来到 Felys\xA0项目\u2060",
  subTitle: "致爱莉希雅与昔涟",
  compiler,
  chat,
  voice,
  articleNamespace: "文章",
};
