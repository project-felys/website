import type { Config, Locale } from "@/lib/config/types";
import { EN } from "@/lib/config/en";
import { ZH } from "@/lib/config/zh";

/**
 * The single source of truth for which locales exist.
 *
 * Adding a language means adding a member to the `Locale` union and an entry
 * here; TypeScript enforces both, and the `Config & { root: K }` shape makes the
 * `root` field of each config checked against its own key. That matters because
 * `root` is what every `/${root}/...` link is built from, so a mismatch would
 * silently point navigation at the wrong locale.
 */
export const LOCALES: { [K in Locale]: Config & { root: K } } = {
  en: EN,
  zh: ZH,
};

export const LOCALE_LIST = Object.keys(LOCALES) as Locale[];

const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return value in LOCALES;
}

/**
 * Best-effort match of an `Accept-Language` header, e.g.
 * `"zh-CN,zh;q=0.9,en;q=0.8"` resolves to `"zh"`.
 */
export function resolveLocale(acceptLanguage: string | null): Locale {
  const tags = (acceptLanguage ?? "")
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase() ?? "");

  for (const tag of tags) {
    const base = tag.split("-")[0];
    if (base && isLocale(base)) {
      return base;
    }
  }

  return DEFAULT_LOCALE;
}
