"use client";

import type { LanguageCode } from "@mentora/shared-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import en from "@/locales/en.json";
import ru from "@/locales/ru.json";
import uz from "@/locales/uz.json";
import { updateMeLanguage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const messages = { ru, uz, en } as const;

interface I18nState {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nState | undefined>(undefined);

const FALLBACK_I18N: I18nState = {
  language: "ru",
  setLanguage: async () => undefined,
  t: (key) => readMessage("ru", key),
};

function readMessage(language: LanguageCode, key: string): string {
  let value: unknown = messages[language];
  for (const segment of key.split(".")) {
    if (!value || typeof value !== "object" || !(segment in value)) return key;
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === "string" ? value : key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  const [language, setLocalLanguage] = useState<LanguageCode>("ru");

  useEffect(() => {
    const next = user?.interface_language;
    if (next) {
      window.localStorage.setItem("mentora-interface-language", next);
      const timer = window.setTimeout(() => setLocalLanguage(next), 0);
      return () => window.clearTimeout(timer);
    }
    const stored = window.localStorage.getItem("mentora-interface-language");
    if (stored === "ru" || stored === "uz" || stored === "en") {
      const timer = window.setTimeout(() => setLocalLanguage(stored), 0);
      return () => window.clearTimeout(timer);
    }
  }, [user?.interface_language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(
    async (next: LanguageCode) => {
      setLocalLanguage(next);
      window.localStorage.setItem("mentora-interface-language", next);
      if (accessToken) await updateMeLanguage(accessToken, next);
    },
    [accessToken],
  );

  const value = useMemo<I18nState>(
    () => ({ language, setLanguage, t: (key) => readMessage(language, key) }),
    [language, setLanguage],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  const context = useContext(I18nContext);
  // Isolated component tests can render a page without the application root.
  // Keep a deterministic Russian fallback while production always uses the provider.
  return context ?? FALLBACK_I18N;
}
