import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Toaster } from "@/components/common/Toaster";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import { useConfirmStore } from "@/store/useConfirmStore";
import { useToastStore } from "@/store/useToastStore";

/** Minimal store standing in for a deletable list with snapshot/restore. */
let items: string[];

function Harness() {
  const confirmDelete = useConfirmDelete();
  return (
    <>
      <button
        onClick={() => {
          const snapshot = [...items];
          void confirmDelete({
            confirm: { title: "Eintrag löschen?" },
            toastMessage: "Eintrag gelöscht.",
            perform: () => {
              items = items.filter((i) => i !== "a");
            },
            undo: () => {
              items = snapshot;
            },
          });
        }}
      >
        Löschen
      </button>
      <ConfirmDialog />
      <Toaster />
    </>
  );
}

beforeEach(() => {
  items = ["a", "b"];
  useConfirmStore.setState({ request: null });
  useToastStore.setState({ toasts: [] });
});

describe("confirm → delete → toast → undo flow (TASK-040)", () => {
  it("cancelling the confirm does not delete", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Löschen" }));
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));

    expect(items).toEqual(["a", "b"]);
    expect(screen.queryByTestId("toast")).toBeNull();
  });

  it("confirming deletes and shows an undo toast", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Löschen" }));
    // The shared confirm uses "Löschen" as its default confirm label, so two
    // buttons share that name now – the dialog's is the last one.
    const confirmButtons = screen.getAllByRole("button", { name: "Löschen" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    expect(items).toEqual(["b"]);
    expect(await screen.findByTestId("toast")).toHaveTextContent("Eintrag gelöscht.");
  });

  it("undo restores the previous state", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Löschen" }));
    const confirmButtons = screen.getAllByRole("button", { name: "Löschen" });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await user.click(await screen.findByRole("button", { name: "Rückgängig" }));

    expect(items).toEqual(["a", "b"]);
    // The toast is dismissed once undo runs.
    await waitFor(() => expect(screen.queryByTestId("toast")).toBeNull());
  });
});
