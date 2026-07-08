import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { STATUS_STYLES, StatusBadge } from "@/components/agents/StatusBadge";
import type { StatusType } from "@/types";

describe("StatusBadge", () => {
  it("renders the default label for every status", () => {
    (Object.keys(STATUS_STYLES) as StatusType[]).forEach((status) => {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(STATUS_STYLES[status].label)).toBeInTheDocument();
      unmount();
    });
  });

  it("maps a status to its color token class", () => {
    render(<StatusBadge status="success" />);
    const badge = screen.getByText("OK");
    expect(badge).toHaveClass("text-success");
    expect(badge).toHaveAttribute("data-status", "success");
  });

  it("maps the danger status to its own color", () => {
    render(<StatusBadge status="danger" />);
    expect(screen.getByText("Kritisch")).toHaveClass("text-danger");
  });

  it("prefers an explicit label over the default", () => {
    render(<StatusBadge status="running" label="Läuft gerade" />);
    expect(screen.getByText("Läuft gerade")).toBeInTheDocument();
  });
});
