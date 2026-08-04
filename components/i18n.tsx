"use client";

import { createContext, useContext, type ReactNode } from "react";
import { type Config, EN, ZH } from "@/lib/config";

const ConfigContext = createContext<Config | undefined>(undefined);

const LOCALES: Record<Config["root"], Config> = { en: EN, zh: ZH };

export function ConfigProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Config["root"];
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
