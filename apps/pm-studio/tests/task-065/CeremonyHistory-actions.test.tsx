import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CeremonyHistory } from "@/components/ceremony/CeremonyHistory";
import { ceremonyHistory } from "@/lib/ceremonies";
import type { BoardTask, SprintRetro, Team } from "@/types";

const teams: Team[] = [{ id: "t1", name: "Core" }];
const sprintLabel = (id: string) => (id === "s1" ? "Projekt A · Sprint 1" : id);

const retro: SprintRetro = {
  sprintId: "s1",
  good: ["Gute Abstimmung"],
  improve: ["Weniger WIP"],
  actions: ["CI reparieren", "Doku ergänzen"],
  id: "rt1",
  scope: "cross",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function boardTask(overrides: Partial<BoardTask> & { id: string }): BoardTask {
  return {
    title: `Task ${overrides.id}`,
    column: "todo",
    order: 0,
    projectId: "p1",
    projectName: "Projekt",
    priority: "mittel",
    ...overrides,
  };
}

describe("CeremonyHistory retro actions → tasks (TASK-065)", () => {
  it("renders a create button per retro action when no task exists", () => {
    render(
      <CeremonyHistory
        entries={ceremonyHistory([], [retro])}
        sprintLabel={sprintLabel}
        teams={teams}
      />,
    );
    expect(screen.getAllByTestId("retro-action-create-task")).toHaveLength(2);
    expect(screen.queryByTestId("retro-action-linked")).not.toBeInTheDocument();
  });

  it("calls onCreateActionTask with the retro and action text on click", async () => {
    const user = userEvent.setup();
    const onCreateActionTask = vi.fn();
    render(
      <CeremonyHistory
        entries={ceremonyHistory([], [retro])}
        sprintLabel={sprintLabel}
        teams={teams}
        onCreateActionTask={onCreateActionTask}
      />,
    );
    await user.click(screen.getAllByTestId("retro-action-create-task")[0]);
    expect(onCreateActionTask).toHaveBeenCalledWith(retro, "CI reparieren");
  });

  it("shows a linked badge instead of the button once a task exists (dedup)", () => {
    // A task already spawned from the first action, second still open.
    const tasks = [
      boardTask({
        id: "t1",
        sourceRetroId: "rt1",
        sourceRetroAction: "CI reparieren",
      }),
    ];
    render(
      <CeremonyHistory
        entries={ceremonyHistory([], [retro])}
        sprintLabel={sprintLabel}
        teams={teams}
        boardTasks={tasks}
      />,
    );
    // One badge (linked action) + one remaining create button (open action).
    expect(screen.getAllByTestId("retro-action-linked")).toHaveLength(1);
    expect(screen.getAllByTestId("retro-action-create-task")).toHaveLength(1);
    expect(screen.getByText("Task erstellt")).toBeInTheDocument();
  });
});
