import { create } from "zustand";

export type ConfirmTone = "danger" | "default";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" renders the confirm button destructively (irreversible steps). */
  tone?: ConfirmTone;
};

type ConfirmRequest = ConfirmOptions & { id: string };

type ConfirmState = {
  /** The currently open confirmation, or null when nothing is pending. */
  request: ConfirmRequest | null;
  /** Open a confirmation and resolve to true (confirmed) or false (cancelled). */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Settle the open request – called by the ConfirmDialog host. */
  resolve: (confirmed: boolean) => void;
};

/**
 * Pending resolver kept outside the store: a Promise's `resolve` is not
 * serialisable state, so we hold it module-side and only mirror the visible
 * request in the store.
 */
let pendingResolve: ((confirmed: boolean) => void) | null = null;

/**
 * Imperative confirmation prompt for the safe-lifecycle pattern (TASK-040). One
 * shared mechanism instead of ad-hoc dialogs per component: `confirm(options)`
 * returns a Promise that settles when the user confirms or cancels. Rendered by
 * the single `ConfirmDialog` host in the dashboard layout.
 */
export const useConfirmStore = create<ConfirmState>()((set) => ({
  request: null,
  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      // A new prompt supersedes any still-open one (treat it as cancelled).
      pendingResolve?.(false);
      pendingResolve = resolve;
      set({ request: { id: crypto.randomUUID(), ...options } });
    }),
  resolve: (confirmed) => {
    pendingResolve?.(confirmed);
    pendingResolve = null;
    set({ request: null });
  },
}));
