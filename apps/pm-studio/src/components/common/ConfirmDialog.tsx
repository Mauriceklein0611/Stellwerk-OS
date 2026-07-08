"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirmStore } from "@/store/useConfirmStore";

/**
 * Global confirmation host for the safe-lifecycle pattern (TASK-040). Mounted
 * once in the dashboard layout; renders whatever `useConfirmStore.confirm()`
 * requests and settles its Promise on confirm / cancel. Closing via overlay or
 * Esc counts as cancel, so no destructive action runs without an explicit OK.
 */
export function ConfirmDialog() {
  const request = useConfirmStore((state) => state.request);
  const resolve = useConfirmStore((state) => state.resolve);

  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) resolve(false);
      }}
    >
      <DialogContent showCloseButton={false}>
        {request && (
          <>
            <DialogHeader>
              <DialogTitle>{request.title}</DialogTitle>
              {request.description && (
                <DialogDescription>{request.description}</DialogDescription>
              )}
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => resolve(false)}>
                {request.cancelLabel ?? "Abbrechen"}
              </Button>
              <Button
                variant={request.tone === "danger" ? "destructive" : "default"}
                onClick={() => resolve(true)}
              >
                {request.confirmLabel ?? "Bestätigen"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
