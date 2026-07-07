import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentOutputView } from "@/components/agents/AgentOutputView";

describe("AgentOutputView", () => {
  it("renders the output as formatted JSON", () => {
    const { container } = render(
      <AgentOutputView output={{ epics: 3, top: "Scope-Creep" }} />,
    );

    const text = container.textContent ?? "";
    expect(text).toContain('"epics": 3');
    expect(text).toContain('"top": "Scope-Creep"');
  });
});
