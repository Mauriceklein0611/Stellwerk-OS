import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricCard } from "@/components/dashboard/MetricCard";
import type { Metric } from "@/types";

const metric: Metric = {
  id: "m-1",
  label: "Aktive Projekte",
  value: 8,
  trend: { value: "+2", direction: "up" },
  series: [
    { i: 0, value: 4 },
    { i: 1, value: 8 },
  ],
};

describe("MetricCard", () => {
  it("renders label, value and trend from data", () => {
    render(<MetricCard metric={metric} />);

    expect(screen.getByText("Aktive Projekte")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
