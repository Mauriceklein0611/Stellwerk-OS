import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RiskTable } from "@/components/project/RiskTable";
import type { RiskEntry } from "@/types";

const risks: RiskEntry[] = [
  {
    id: "R-1",
    title: "Scope-Creep",
    probability: "mittel",
    impact: "hoch",
    mitigation: "MVP abgrenzen",
    priority: "hoch",
    escalation: "Steering",
    owner: "PO",
    status: "open",
  },
];

describe("RiskTable (TASK-045)", () => {
  it("renders owner and status columns", () => {
    render(<RiskTable risks={risks} onChange={() => {}} />);
    expect(screen.getByText("PO")).toBeInTheDocument();
    // Status "open" -> StatusBadge label "Offen".
    expect(screen.getByText("Offen")).toBeInTheDocument();
  });

  it("shows an empty state and an add button when there are no risks", () => {
    render(<RiskTable risks={[]} onChange={() => {}} />);
    expect(screen.getByText(/Noch keine Risiken/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Risiko hinzufügen" }),
    ).toBeInTheDocument();
  });

  it("adds a risk through the dialog", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RiskTable risks={[]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Risiko hinzufügen" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Risiko"), "Neues Risiko");
    await user.click(within(dialog).getByRole("button", { name: "Speichern" }));

    const next = onChange.mock.calls.at(-1)?.[0] as RiskEntry[];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ title: "Neues Risiko", status: "open" });
  });

  it("edits an existing risk and preserves its id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RiskTable risks={risks} onChange={onChange} />);

    await user.click(
      screen.getByRole("button", { name: 'Risiko „Scope-Creep“ bearbeiten' }),
    );
    const dialog = screen.getByRole("dialog");
    const titleField = within(dialog).getByLabelText("Risiko");
    await user.clear(titleField);
    await user.type(titleField, "Scope-Creep (v2)");
    await user.click(within(dialog).getByRole("button", { name: "Speichern" }));

    const next = onChange.mock.calls.at(-1)?.[0] as RiskEntry[];
    expect(next[0]).toMatchObject({ id: "R-1", title: "Scope-Creep (v2)" });
  });
});
