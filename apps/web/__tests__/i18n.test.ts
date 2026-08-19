import { describe, expect, it } from "vitest";

import en from "@/locales/en.json";
import ru from "@/locales/ru.json";
import uz from "@/locales/uz.json";

function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value).reduce<Record<string, string>>((result, [key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string") result[path] = child;
    else Object.assign(result, flatten(child, path));
    return result;
  }, {});
}

describe("interface localization catalogs", () => {
  const catalogs = { ru: flatten(ru), uz: flatten(uz), en: flatten(en) };

  it("keeps the same complete key set in RU, UZ and EN", () => {
    const expected = Object.keys(catalogs.ru).sort();
    expect(Object.keys(catalogs.uz).sort()).toEqual(expected);
    expect(Object.keys(catalogs.en).sort()).toEqual(expected);
    expect(expected.length).toBeGreaterThan(150);
  });

  it.each(Object.entries(catalogs))("contains no empty %s translations", (_language, catalog) => {
    expect(Object.values(catalog).every((message) => message.trim().length > 0)).toBe(true);
  });

  it("contains translated core navigation instead of one shared language", () => {
    expect(catalogs.ru["nav.classes"]).toBe("Классы");
    expect(catalogs.uz["nav.classes"]).toBe("Sinflar");
    expect(catalogs.en["nav.classes"]).toBe("Classes");
  });
});
