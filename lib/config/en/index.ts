import type { Config } from "../types";
import { compiler } from "./compiler";
import { chat } from "./chat";
import { voice } from "./voice";

export const EN: Config = {
  root: "en",
  title: "Welcome to the Felys\xA0project",
  subTitle: "To Elysia and Cyrene",
  compiler,
  chat,
  voice,
  articleNamespace: "Articles",
};
