import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DueBadge } from "@/components/board/DueBadge";

const TODAY = "2026-06-16";

describe("DueBadge (TASK-034)", () => {
  it("renders nothing without a due date", () => {
    const { container } = render(<DueBadge today={TODAY} done={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the compact date and marks an open past date as overdue", () => {
    render(<DueBadge dueDate="2026-06-10" today={TODAY} done={false} />);
    const badge = screen.getByTestId("task-due");
    expect(badge).toHaveTextContent("10.06.");
    expect(badge).toHaveAttribute("data-due-status", "overdue");
  });

  it("marks today's open date as today", () => {
    render(<DueBadge dueDate={TODAY} today={TODAY} done={false} />);
    expect(screen.getByTestId("task-due")).toHaveAttribute(
      "data-due-status",
      "today",
    );
  });

  it("stays neutral (upcoming) for a future date", () => {
    render(<DueBadge dueDate="2026-06-20" today={TODAY} done={false} />);
    expect(screen.getByTestId("task-due")).toHaveAttribute(
      "data-due-status",
      "upcoming",
    );
  });

  it("never flags a done task as overdue", () => {
    render(<DueBadge dueDate="2026-06-10" today={TODAY} done />);
    expect(screen.getByTestId("task-due")).toHaveAttribute(
      "data-due-status",
      "upcoming",
    );
  });
});
