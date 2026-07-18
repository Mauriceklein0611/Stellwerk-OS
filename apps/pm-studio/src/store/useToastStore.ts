import { create } from "zustand";

/** A single transient notification, optionally carrying one action (e.g. Undo). */
export type Toast = {
  id: string;
  message: string;
  /** Optional action label – when set, `onAction` is offered as a button. */
  actionLabel?: string;
  /** Run when the action button is pressed (e.g. restore a deleted entity). */
  onAction?: () => void;
  /** Auto-dismiss delay in ms. The Toaster owns the timer (SSR-safe store). */
  duration: number;
};

type ToastInput = Omit<Toast, "id" | "duration"> & {
  id?: string;
  duration?: number;
};

type ToastState = {
  toasts: Toast[];
  /** Queue a toast and return its id. Defaults to an 8s auto-dismiss. */
  showToast: (toast: ToastInput) => string;
  /** Remove a toast (auto-dismiss timeout or manual close). */
  dismissToast: (id: string) => void;
};

/** Default lifetime – long enough to read the message and hit Undo. */
const DEFAULT_DURATION = 8000;

/**
 * Lightweight toast queue for the safe-lifecycle pattern (TASK-040). Not
 * persisted – toasts are ephemeral UI. Kept timer-free so it stays pure and
 * testable; the `Toaster` component drives auto-dismiss with `setTimeout`.
 */
export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  showToast: ({ id, duration, ...rest }) => {
    const toastId = id ?? crypto.randomUUID();
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: toastId, duration: duration ?? DEFAULT_DURATION, ...rest },
      ],
    }));
    return toastId;
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
