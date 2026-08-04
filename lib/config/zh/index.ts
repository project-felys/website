import type { Config } from "../types";
import { compiler } from "./compiler";
import { chat } from "./chat";
import { voice } from "./voice";

export const ZH: Config = {
  root: "zh",
  title: "欢迎来到 Felys\xA0项目\u2060",
  subTitle: "致爱莉希雅与昔涟",
  compiler,
  chat,
  voice,
  articleNamespace: "文章",
};
