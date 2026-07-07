"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToastStore, type Toast } from "@/store/useToastStore";

/** One toast row: message, optional action (Undo) and a close button. */
function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useToastStore((state) => state.dismissToast);

  // Auto-dismiss after `duration`; cleared if the toast unmounts earlier
  // (manual close or undo), so the timer never fires against a stale id.
  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismissToast]);

  return (
    <div
      role="status"
      data-testid="toast"
      className="pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
    >
      <span className="flex-1">{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast.onAction?.();
            dismissToast(toast.id);
          }}
        >
          {toast.actionLabel}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Hinweis schließen"
        onClick={() => dismissToast(toast.id)}
      >
        <X className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

/**
 * Global toast outlet for the safe-lifecycle pattern (TASK-040). Mounted once in
 * the dashboard layout; renders the `useToastStore` queue bottom-right. Each
 * toast can offer an Undo action that restores the deleted entity.
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
