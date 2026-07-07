import { beforeEach, describe, expect, it, vi } from "vitest";

import { useToastStore } from "@/store/useToastStore";

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe("useToastStore (TASK-040)", () => {
  it("queues a toast and returns its id", () => {
    const id = useToastStore.getState().showToast({ message: "Gelöscht." });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].message).toBe("Gelöscht.");
  });

  it("defaults to an 8s auto-dismiss duration", () => {
    useToastStore.getState().showToast({ message: "x" });
    expect(useToastStore.getState().toasts[0].duration).toBe(8000);
  });

  it("keeps the undo action callable", () => {
    const onAction = vi.fn();
    useToastStore
      .getState()
      .showToast({ message: "x", actionLabel: "Rückgängig", onAction });
    useToastStore.getState().toasts[0].onAction?.();
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("dismissToast removes the toast by id", () => {
    const id = useToastStore.getState().showToast({ message: "x" });
    useToastStore.getState().dismissToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
