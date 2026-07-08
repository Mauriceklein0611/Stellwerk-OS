"use client";

import { useCallback } from "react";

import { useConfirmStore, type ConfirmOptions } from "@/store/useConfirmStore";
import { useToastStore } from "@/store/useToastStore";

export type ConfirmDeleteArgs = {
  /** Confirmation copy shown before the destructive step runs. */
  confirm: ConfirmOptions;
  /** Toast message shown after a successful delete. */
  toastMessage: string;
  /** Perform the deletion, including any reference cleanup. */
  perform: () => void;
  /** Optional 1:1 restore wired to the toast's Undo action. */
  undo?: () => void;
};

/**
 * The one shared "safe delete" flow (TASK-040): confirm → delete → toast with
 * Undo. Components supply `perform`/`undo` closures (capturing a snapshot for a
 * 1:1 restore); the confirm prompt and toast come from the shared stores, so
 * there is a single mechanism instead of ad-hoc dialogs per component.
 */
export function useConfirmDelete() {
  const confirm = useConfirmStore((state) => state.confirm);
  const showToast = useToastStore((state) => state.showToast);

  return useCallback(
    async ({ confirm: options, toastMessage, perform, undo }: ConfirmDeleteArgs) => {
      const ok = await confirm({
        tone: "danger",
        confirmLabel: "Löschen",
        ...options,
      });
      if (!ok) return false;

      perform();
      showToast({
        message: toastMessage,
        actionLabel: undo ? "Rückgängig" : undefined,
        onAction: undo,
      });
      return true;
    },
    [confirm, showToast],
  );
}
