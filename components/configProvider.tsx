"use client";

import { createContext, useContext, type ReactNode } from "react";
import { LOCALES, type Config, type Locale } from "@/lib/config";

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
