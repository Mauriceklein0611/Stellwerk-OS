import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ActivityFeedPanel } from "@/components/activity/ActivityFeedPanel";
import { useActivityStore } from "@/store/useActivityStore";
import type { ActivityEvent } from "@/types";

function event(patch: Partial<ActivityEvent>): ActivityEvent {
  return {
    id: "e",
    entityType: "task",
    entityId: "t1",
    kind: "create",
    summary: "",
    actor: "human",
    createdAt: "2026-06-22T10:00:00.000Z",
    ...patch,
  };
}

beforeEach(() => {
  useActivityStore.setState({ events: [] });
});

describe("ActivityFeedPanel (TASK-043)", () => {
  it("shows the empty state when the entity has no events", () => {
    render(<ActivityFeedPanel entityType="task" entityId="t1" />);
    expect(screen.getByTestId("activity-feed-empty")).toBeInTheDocument();
  });

  it("renders this entity's events newest first and ignores others", () => {
    useActivityStore.setState({
      events: [
        event({ id: "a", summary: "Älter", createdAt: "2026-06-22T10:00:00.000Z" }),
        event({ id: "b", summary: "Neuer", createdAt: "2026-06-22T12:00:00.000Z" }),
        event({ id: "c", entityId: "t2", summary: "Fremd" }),
      ],
    });

    render(<ActivityFeedPanel entityType="task" entityId="t1" />);

    const rows = screen.getAllByTestId("activity-event");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Neuer");
    expect(rows[1]).toHaveTextContent("Älter");
    expect(screen.queryByText("Fremd")).not.toBeInTheDocument();
  });

  it("respects the limit prop", () => {
    useActivityStore.setState({
      events: [
        event({ id: "a", summary: "1", createdAt: "2026-06-22T10:00:00.000Z" }),
        event({ id: "b", summary: "2", createdAt: "2026-06-22T11:00:00.000Z" }),
        event({ id: "c", summary: "3", createdAt: "2026-06-22T12:00:00.000Z" }),
      ],
    });

    render(<ActivityFeedPanel entityType="task" entityId="t1" limit={2} />);
    expect(screen.getAllByTestId("activity-event")).toHaveLength(2);
  });
});
