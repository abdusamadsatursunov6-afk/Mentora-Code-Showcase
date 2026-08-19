"use client";

import type { LanguageCode } from "@mentora/shared-types";

import { useI18n } from "@/lib/i18n-context";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useI18n();
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      {!compact && <span>{t("common.language")}</span>}
      <select
        aria-label={t("account.interfaceLanguage")}
        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
        value={language}
        onChange={(event) => void setLanguage(event.target.value as LanguageCode)}
      >
        <option value="ru">RU</option>
        <option value="uz">UZ</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
