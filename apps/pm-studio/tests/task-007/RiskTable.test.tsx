import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RiskTable } from "@/components/project/RiskTable";
import type { RiskEntry } from "@/types";

const risks: RiskEntry[] = [
  {
    id: "R-1",
    title: "Scope-Creep",
    probability: "mittel",
    impact: "hoch",
    mitigation: "MVP klar abgrenzen",
    priority: "hoch",
    escalation: "Product Owner",
    status: "open",
  },
  {
    id: "R-2",
    title: "Technische Schulden",
    probability: "mittel",
    impact: "mittel",
    mitigation: "Reviews und Tests",
    priority: "mittel",
    escalation: "Tech Lead",
    status: "open",
  },
];

describe("RiskTable", () => {
  it("renders a row per risk with title and mitigation", () => {
    render(<RiskTable risks={risks} onChange={() => {}} />);

    expect(screen.getByText("Scope-Creep")).toBeInTheDocument();
    expect(screen.getByText("Technische Schulden")).toBeInTheDocument();
    expect(screen.getByText("MVP klar abgrenzen")).toBeInTheDocument();
  });

  it("color-codes levels via StatusBadge labels", () => {
    render(<RiskTable risks={risks} onChange={() => {}} />);
    // R-1 has impact + priority "hoch" -> at least two "Hoch" badges.
    expect(screen.getAllByText("Hoch").length).toBeGreaterThanOrEqual(2);
  });
});
