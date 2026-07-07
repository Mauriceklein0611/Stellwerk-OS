import { create } from "zustand";

/**
 * Cross-page "create" intent raised by the CommandBar actions (TASK-042). The
 * palette can't host every create dialog itself, so it navigates to the owning
 * page and records the intent here; that page opens its dialog by reading the
 * intent during render and clears it on close. Ephemeral – never persisted.
 *
 * Driving the dialog from this value (instead of a setState-in-effect) keeps the
 * open purely declarative and avoids cascading-render lint violations.
 */
export type CommandActionIntent =
  | "new-person"
  | "new-release"
  | "new-story"
  | null;

type CommandActionState = {
  intent: CommandActionIntent;
  /** Raise an intent (CommandBar action), consumed by the target page. */
  request: (intent: Exclude<CommandActionIntent, null>) => void;
  /** Clear the intent once the target page has handled (closed) it. */
  clear: () => void;
};

export const useCommandActionStore = create<CommandActionState>((set) => ({
  intent: null,
  request: (intent) => set({ intent }),
  clear: () => set({ intent: null }),
}));
