import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { BoardView } from "@/lib/board";
import { SETTINGS_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

/**
 * Motion preference: follow the OS (`system`), force reduced motion or force
 * full animations. Overrides the raw `prefers-reduced-motion` media query
 * (see useReducedMotion).
 */
export type MotionPreference = "system" | "reduced" | "full";

type SettingsState = {
  /** Theme preference; resolved to a concrete theme by `src/lib/theme.ts`. */
  theme: ThemePreference;
  /** View the board opens in until the user toggles it there (TASK-023). */
  defaultBoardView: BoardView;
  /** Animation override applied across the app. */
  motion: MotionPreference;
  setTheme: (theme: ThemePreference) => void;
  setDefaultBoardView: (view: BoardView) => void;
  setMotion: (motion: MotionPreference) => void;
};

/**
 * User-facing app settings (TASK-029), persisted to localStorage. Default theme
 * stays dark to match the original look. Same persist pattern as the other
 * stores – no `next-themes` dependency.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      defaultBoardView: "kanban",
      motion: "system",
      setTheme: (theme) => set({ theme }),
      setDefaultBoardView: (defaultBoardView) => set({ defaultBoardView }),
      setMotion: (motion) => set({ motion }),
    }),
    { name: SETTINGS_STORAGE_KEY, version: 1 },
  ),
);
