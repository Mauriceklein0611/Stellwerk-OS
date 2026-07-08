import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Sparkline } from "@/components/dashboard/charts/Sparkline";

describe("Sparkline", () => {
  it("renders nothing for empty data", () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a chart container for non-empty data", () => {
    const { container } = render(
      <Sparkline
        data={[
          { i: 0, value: 1 },
          { i: 1, value: 3 },
        ]}
      />,
    );
    expect(container.querySelector('[data-slot="chart"]')).not.toBeNull();
  });
});
