import type { Config } from "@/lib/config/types";
import { CHAT } from "@/lib/config/en/chat";
import { COMPILER } from "@/lib/config/en/compiler";
import { VOICE } from "@/lib/config/en/voice";

// `root` is kept as a literal so `LOCALES` can check it against its own key.
export const EN: Config & { root: "en" } = {
  root: "en",
  title: "Welcome to the Felys\xA0project",
  subTitle: "To Elysia and Cyrene",
  compiler: COMPILER,
  chat: CHAT,
  voice: VOICE,
  articleNamespace: "Articles",
};
