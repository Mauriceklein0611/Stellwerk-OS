"use client";

import { useSyncExternalStore } from "react";

import { useSettingsStore } from "@/store/useSettingsStore";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** Server renders animated (false); the client subscribes to the real value. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Tracks `prefers-reduced-motion`, with the settings override on top (TASK-029):
 * `reduced` / `full` force the value, `system` follows the media query. Charts
 * pass the result to Recharts' `isAnimationActive`. Uses useSyncExternalStore so
 * there is no setState-in-effect.
 */
export function useReducedMotion(): boolean {
  const motion = useSettingsStore((state) => state.motion);
  const systemReduced = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  if (motion === "reduced") return true;
  if (motion === "full") return false;
  return systemReduced;
}
