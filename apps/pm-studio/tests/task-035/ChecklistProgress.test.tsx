import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChecklistProgressBadge } from "@/components/board/ChecklistProgress";
import type { ChecklistItem } from "@/types";

const item = (id: string, done = false): ChecklistItem => ({
  id,
  text: id,
  done,
});

describe("ChecklistProgressBadge (TASK-035)", () => {
  it("renders nothing without a checklist", () => {
    const { container } = render(<ChecklistProgressBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an empty checklist", () => {
    const { container } = render(<ChecklistProgressBadge items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows compact n/m progress and stays incomplete while items remain open", () => {
    render(
      <ChecklistProgressBadge items={[item("1", true), item("2"), item("3")]} />,
    );
    const badge = screen.getByTestId("checklist-progress");
    expect(badge).toHaveTextContent("1/3");
    expect(badge).toHaveAttribute("data-complete", "false");
  });

  it("marks a fully checked list as complete", () => {
    render(<ChecklistProgressBadge items={[item("1", true), item("2", true)]} />);
    const badge = screen.getByTestId("checklist-progress");
    expect(badge).toHaveTextContent("2/2");
    expect(badge).toHaveAttribute("data-complete", "true");
  });
});
