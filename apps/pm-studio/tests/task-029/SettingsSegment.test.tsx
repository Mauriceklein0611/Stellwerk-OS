import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  SettingsSegment,
  type SegmentOption,
} from "@/components/settings/SettingsSegment";

const OPTIONS: SegmentOption<"a" | "b" | "c">[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
];

describe("SettingsSegment (TASK-029)", () => {
  it("renders a labelled radiogroup with one radio per option", () => {
    render(
      <SettingsSegment label="Demo" value="a" options={OPTIONS} onChange={vi.fn()} />,
    );
    expect(screen.getByRole("radiogroup", { name: "Demo" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("marks the selected option as checked", () => {
    render(
      <SettingsSegment label="Demo" value="b" options={OPTIONS} onChange={vi.fn()} />,
    );
    expect(screen.getByRole("radio", { name: "Beta" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Alpha" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("calls onChange with the option value on click", async () => {
    const onChange = vi.fn();
    render(
      <SettingsSegment
        label="Demo"
        value="a"
        options={OPTIONS}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "Gamma" }));
    expect(onChange).toHaveBeenCalledWith("c");
  });
});
