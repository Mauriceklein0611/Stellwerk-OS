import { beforeEach, describe, expect, it } from "vitest";

import { useConfirmStore } from "@/store/useConfirmStore";

beforeEach(() => {
  useConfirmStore.setState({ request: null });
});

describe("useConfirmStore (TASK-040)", () => {
  it("opens a request and resolves true on confirm", async () => {
    const promise = useConfirmStore.getState().confirm({ title: "Löschen?" });
    expect(useConfirmStore.getState().request?.title).toBe("Löschen?");

    useConfirmStore.getState().resolve(true);
    await expect(promise).resolves.toBe(true);
    expect(useConfirmStore.getState().request).toBeNull();
  });

  it("resolves false on cancel", async () => {
    const promise = useConfirmStore.getState().confirm({ title: "Löschen?" });
    useConfirmStore.getState().resolve(false);
    await expect(promise).resolves.toBe(false);
  });

  it("supersedes a pending request, cancelling the previous one", async () => {
    const first = useConfirmStore.getState().confirm({ title: "Erste" });
    const second = useConfirmStore.getState().confirm({ title: "Zweite" });

    // The first promise settles to false when superseded.
    await expect(first).resolves.toBe(false);
    expect(useConfirmStore.getState().request?.title).toBe("Zweite");

    useConfirmStore.getState().resolve(true);
    await expect(second).resolves.toBe(true);
  });
});
