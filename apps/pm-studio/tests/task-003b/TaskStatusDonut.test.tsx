import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaskStatusDonut } from "@/components/dashboard/charts/TaskStatusDonut";
import type { TaskStatusSlice } from "@/types";

const data: TaskStatusSlice[] = [
  { status: "success", label: "Erledigt", count: 42 },
  { status: "warning", label: "Blockiert", count: 5 },
];

describe("TaskStatusDonut", () => {
  it("renders the legend labels and counts from data", () => {
    render(<TaskStatusDonut data={data} />);

    expect(screen.getByText("Erledigt")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Blockiert")).toBeInTheDocument();
  });

  it("shows an empty state without data", () => {
    render(<TaskStatusDonut data={[]} />);
    expect(screen.getByText("Keine Daten.")).toBeInTheDocument();
  });
});
