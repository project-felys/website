export type {
  Config,
  Locale,
  CompilerConfig,
  ChatConfig,
  VoiceConfig,
  CompilerText,
  ChatText,
  VoiceText,
} from "@/lib/config/types";
export { EN } from "@/lib/config/en";
export { ZH } from "@/lib/config/zh";
export { LOCALES, LOCALE_LIST, isLocale, resolveLocale } from "@/lib/config/locales";
export {
  BOOK_URL,
  BACKEND_HEALTH_URL,
  CHAT_COMPLETIONS_URL,
  TTS_SOCKET_URL,
  TTS_HEALTH_URL,
} from "@/lib/config/endpoints";
