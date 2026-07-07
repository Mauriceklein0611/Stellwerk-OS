import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressBar } from "@/components/ui/ProgressBar";

/** The colored fill sits inside the progressbar element. */
function fill() {
  return screen.getByTestId("progress-bar-fill");
}

describe("ProgressBar (TASK-028)", () => {
  it("fills proportionally for a value within range", () => {
    render(<ProgressBar value={3} max={6} />);
    expect(fill()).toHaveStyle({ width: "50%" });
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "6");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
  });

  it("clamps overload to 100 % (value > max)", () => {
    render(<ProgressBar value={12} max={8} />);
    expect(fill()).toHaveStyle({ width: "100%" });
    // ARIA value is clamped into [0, max] so it stays valid.
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "8");
  });

  it("clamps a negative value to 0 %", () => {
    render(<ProgressBar value={-5} max={10} />);
    expect(fill()).toHaveStyle({ width: "0%" });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("handles max = 0 without dividing by zero", () => {
    render(<ProgressBar value={4} max={0} />);
    expect(fill()).toHaveStyle({ width: "0%" });
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "0");
  });

  it("treats a negative max as empty", () => {
    render(<ProgressBar value={4} max={-3} />);
    expect(fill()).toHaveStyle({ width: "0%" });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "0");
  });

  it("rounds the fill to a whole percent", () => {
    render(<ProgressBar value={1} max={3} />);
    expect(fill()).toHaveStyle({ width: "33%" });
  });

  it("defaults to the info status token", () => {
    render(<ProgressBar value={1} max={2} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-status", "info");
    expect(fill()).toHaveClass("bg-info");
  });

  it("maps each status to its color token (single-sourced)", () => {
    const cases = [
      ["success", "bg-success"],
      ["warning", "bg-warning"],
      ["danger", "bg-danger"],
      ["idle", "bg-idle"],
    ] as const;
    for (const [status, cls] of cases) {
      const { unmount } = render(
        <ProgressBar value={1} max={2} status={status} />,
      );
      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "data-status",
        status,
      );
      expect(fill()).toHaveClass(cls);
      unmount();
    }
  });

  it("exposes an accessible name via label", () => {
    render(<ProgressBar value={2} max={4} label="Auslastung Mia" />);
    expect(
      screen.getByRole("progressbar", { name: "Auslastung Mia" }),
    ).toBeInTheDocument();
  });
});
