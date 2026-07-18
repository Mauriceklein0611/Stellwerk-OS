import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgentStore } from "@/store/useAgentStore";

describe("simulateAgentRun", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAgentStore.setState({
      agentStatuses: { draft: "idle" },
      agentRuns: { draft: [] },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets running immediately, then success + a new run after 3s", () => {
    useAgentStore.getState().simulateAgentRun("draft");

    expect(useAgentStore.getState().agentStatuses.draft).toBe("running");
    expect(useAgentStore.getState().agentRuns.draft).toHaveLength(0);

    vi.advanceTimersByTime(3000);

    expect(useAgentStore.getState().agentStatuses.draft).toBe("success");
    expect(useAgentStore.getState().agentRuns.draft).toHaveLength(1);
    expect(useAgentStore.getState().agentRuns.draft[0].status).toBe("success");
  });
});
