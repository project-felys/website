import type { Config } from "../types";
import { compiler } from "./compiler";
import { chat } from "./chat";
import { voice } from "./voice";

// `root` is kept as a literal so `LOCALES` can check it against its own key.
export const EN: Config & { root: "en" } = {
  root: "en",
  title: "Welcome to the Felys\xA0project",
  subTitle: "To Elysia and Cyrene",
  compiler,
  chat,
  voice,
  articleNamespace: "Articles",
};
