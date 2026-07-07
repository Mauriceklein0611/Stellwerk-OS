import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PipelineStepper } from "@/components/project/PipelineStepper";
import type { StepKey, StepStatus } from "@/lib/pipeline-steps";

const statuses: Record<StepKey, StepStatus> = {
  draft: "done",
  requirements: "running",
  scrum: "pending",
  po: "pending",
  risk: "pending",
  review: "pending",
};

describe("PipelineStepper", () => {
  it("renders every step label", () => {
    render(<PipelineStepper statuses={statuses} onStepClick={() => {}} />);
    ["Draft", "Requirements", "Scrum", "PO", "Risk", "Review"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("navigates from a done step but not from a pending one", async () => {
    const onStepClick = vi.fn();
    render(<PipelineStepper statuses={statuses} onStepClick={onStepClick} />);

    await userEvent.click(screen.getByText("Draft"));
    expect(onStepClick).toHaveBeenCalledWith("draft");

    // Pending steps are not clickable.
    expect(screen.getByText("Scrum").closest("button")).toBeDisabled();
  });
});
