/**
 * Theme strategy (TASK-029). Single source of truth for theme preferences,
 * resolution and the no-flash bootstrap script.
 *
 * The app supports Dark (default), Light and System. The preference lives in
 * the persisted settings store (`pm-studio-settings`); this module only knows
 * how to turn a preference into the concrete `.dark` class on <html>.
 */

export type ThemePreference = "light" | "dark" | "system";

/** localStorage key used by the settings store (zustand persist). */
export const SETTINGS_STORAGE_KEY = "pm-studio-settings";

/** Selectable theme options (single source for the settings UI). */
export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Hell" },
  { value: "dark", label: "Dunkel" },
  { value: "system", label: "System" },
];

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Resolve a preference (plus the current OS setting) to a concrete theme. */
export function resolveTheme(
  theme: ThemePreference,
  systemPrefersDark: boolean,
): "light" | "dark" {
  if (theme === "system") return systemPrefersDark ? "dark" : "light";
  return theme;
}

/** Apply the resolved theme by toggling the `.dark` class on <html>. */
export function applyThemeClass(resolved: "light" | "dark"): void {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

/** True if the OS currently prefers a dark color scheme. */
export function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

/**
 * Inline script injected before the first paint (layout.tsx). It reads the
 * persisted theme straight from localStorage and sets the `.dark` class so the
 * page never flashes the wrong theme (FOUC). Defaults to dark and swallows any
 * error (private mode, malformed JSON) to never block rendering.
 *
 * Kept as a plain string so it can run standalone in <head>, before React and
 * the store hydrate.
 */
export const themeInitScript = `(function(){try{var t='dark';var raw=localStorage.getItem('${SETTINGS_STORAGE_KEY}');if(raw){var s=JSON.parse(raw);var v=s&&s.state&&s.state.theme;if(v==='light'||v==='dark'||v==='system')t=v;}var dark=t==='dark'||(t==='system'&&window.matchMedia('${DARK_QUERY}').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;
