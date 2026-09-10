"use client";

import { createContext, useContext, type ReactNode } from "react";
// Direct module paths, not the `@/lib/config` barrel: this file lives inside
// `lib/config/`, and the barrel is deliberately kept free of client code.
import { LOCALES } from "@/lib/config/locales";
import type { Config, Locale } from "@/lib/config/types";

const ConfigContext = createContext<Config | undefined>(undefined);

export function ConfigProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  return <ConfigContext value={LOCALES[locale]}>{children}</ConfigContext>;
}

export function useConfig() {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return config;
}
