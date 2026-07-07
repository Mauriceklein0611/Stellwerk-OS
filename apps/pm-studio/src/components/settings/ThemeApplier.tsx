"use client";

import { useEffect } from "react";

import { applyThemeClass, resolveTheme, systemPrefersDark } from "@/lib/theme";
import { useSettingsStore } from "@/store/useSettingsStore";

/**
 * Applies the persisted theme at runtime (TASK-029): re-applies the `.dark`
 * class whenever the preference changes and, while on `system`, follows live
 * OS changes via `matchMedia`. The initial paint is handled by the no-flash
 * script in layout.tsx; this keeps the class in sync afterwards. Renders nothing.
 */
export function ThemeApplier() {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    applyThemeClass(resolveTheme(theme, systemPrefersDark()));
    if (theme !== "system") return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeClass(resolveTheme("system", query.matches));
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  return null;
}
