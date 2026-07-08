import { create } from "zustand";
import { persist } from "zustand/middleware";

import { createActivityEvent, type ActivityEventInput } from "@/lib/activity";
import type { ActivityEvent } from "@/types";

type ActivityState = {
  /** Append-only event log (TASK-043). Newest events are appended at the end. */
  events: ActivityEvent[];
  /**
   * Central write path: every entity mutation calls this with an input, the
   * store builds the event (id/timestamp) and appends it. Append-only – a
   * single mutation never rewrites the whole list (performance).
   */
  log: (input: ActivityEventInput) => void;
  /** Restore the events list from a snapshot (kept for parity with TASK-040). */
  restore: (events: ActivityEvent[]) => void;
};

/**
 * The activity log is a leaf store: it imports no other store, so the mutation
 * stores (project/board/sprint/release) can call `useActivityStore.getState().log(...)`
 * from within their actions without any module-init cycle.
 */
export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      events: [],
      log: (input) =>
        set((state) => ({
          events: [...state.events, createActivityEvent(input)],
        })),
      restore: (events) => set({ events }),
    }),
    {
      name: "pm-studio-activity",
      version: 1,
      partialize: (state) => ({ events: state.events }),
    },
  ),
);

/** Convenience wrapper so call sites read clearly: `logActivity({ … })`. */
export function logActivity(input: ActivityEventInput): void {
  useActivityStore.getState().log(input);
}
