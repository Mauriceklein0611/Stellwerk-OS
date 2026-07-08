import { describe, expect, it } from "vitest";

import {
  SETTINGS_STORAGE_KEY,
  THEME_OPTIONS,
  applyThemeClass,
  resolveTheme,
  themeInitScript,
} from "@/lib/theme";

describe("resolveTheme", () => {
  it("returns the explicit theme regardless of the system setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the system preference when set to system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("applyThemeClass", () => {
  it("toggles the .dark class on <html>", () => {
    applyThemeClass("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyThemeClass("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("THEME_OPTIONS", () => {
  it("offers exactly light, dark and system", () => {
    expect(THEME_OPTIONS.map((option) => option.value)).toEqual([
      "light",
      "dark",
      "system",
    ]);
  });
});

describe("themeInitScript", () => {
  it("reads the settings storage key and defaults to dark", () => {
    expect(themeInitScript).toContain(SETTINGS_STORAGE_KEY);
    expect(themeInitScript).toContain("'dark'");
    // Wrapped in a try/catch so a storage failure never blocks rendering.
    expect(themeInitScript).toContain("try");
    expect(themeInitScript).toContain("catch");
  });
});
