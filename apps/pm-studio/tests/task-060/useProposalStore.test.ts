import { beforeEach, describe, expect, it } from "vitest";

import { useProposalStore } from "@/store/useProposalStore";
import { mockFollowUpQuestion } from "@/lib/mock-planning";
import type { ProjectIdea } from "@/types";

/**
 * TASK-060: the guided-planning store. Covers the deterministic chat (exactly one
 * follow-up), the gate guards (no step runs without the prior phase) and the
 * proposal inbox data (scrum gate produces proposals; auto mode preselects all).
 */

const idea: ProjectIdea = {
  id: "p1",
  createdAt: new Date().toISOString(),
  status: "idea",
  name: "Planner",
  description: "desc",
  problem: "problem",
  features: ["A", "B"],
  approach: "agil",
};

const planning = () => useProposalStore.getState().byProject[idea.id];

beforeEach(() => {
  useProposalStore.setState({ byProject: {} });
});

describe("start", () => {
  it("opens a chatting session with one agent greeting", () => {
    useProposalStore.getState().start(idea);
    expect(planning().phase).toBe("chatting");
    expect(planning().conversation.messages).toHaveLength(1);
    expect(planning().conversation.messages[0].role).toBe("agent");
    expect(planning().askedFollowUp).toBe(false);
    expect(planning().proposals).toEqual([]);
  });
});

describe("sendMessage", () => {
  it("asks exactly one deterministic follow-up, then acknowledges", () => {
    const store = useProposalStore.getState();
    store.start(idea);
    store.sendMessage(idea, "Meine Idee ist X");
    store.sendMessage(idea, "Noch ein Detail");

    const messages = planning().conversation.messages;
    const followUps = messages.filter(
      (m) => m.text === mockFollowUpQuestion(idea),
    );
    expect(followUps).toHaveLength(1);
    expect(planning().askedFollowUp).toBe(true);
    // greeting + (user + followUp) + (user + ack) = 5
    expect(messages).toHaveLength(5);
  });

  it("ignores empty input", () => {
    const store = useProposalStore.getState();
    store.start(idea);
    store.sendMessage(idea, "   ");
    expect(planning().conversation.messages).toHaveLength(1);
  });
});

describe("gates", () => {
  it("createDraft only runs from the chatting phase", () => {
    const store = useProposalStore.getState();
    store.start(idea);
    store.createDraft(idea);
    expect(planning().phase).toBe("draft_review");

    // Re-running does nothing (already past chatting).
    store.createDraft(idea);
    expect(planning().phase).toBe("draft_review");
  });

  it("approveDraft only runs from draft_review", () => {
    const store = useProposalStore.getState();
    store.start(idea);
    // Skipping createDraft: approveDraft is a no-op while still chatting.
    store.approveDraft(idea);
    expect(planning().phase).toBe("chatting");

    store.createDraft(idea);
    store.approveDraft(idea);
    expect(planning().phase).toBe("requirements_review");
  });

  it("approveRequirements produces proposals only from requirements_review", () => {
    const store = useProposalStore.getState();
    store.start(idea);
    // No-op before the requirements gate.
    store.approveRequirements(idea);
    expect(planning().proposals).toEqual([]);

    store.createDraft(idea);
    store.approveDraft(idea);
    store.approveRequirements(idea);
    expect(planning().phase).toBe("proposals");
    expect(planning().proposals.length).toBeGreaterThan(0);
    expect(planning().autoMode).toBe(false);
  });
});

describe("runAuto", () => {
  it("fills the inbox from scratch and preselects all", () => {
    useProposalStore.getState().runAuto(idea);
    expect(planning().phase).toBe("proposals");
    expect(planning().proposals.length).toBeGreaterThan(0);
    expect(planning().autoMode).toBe(true);
  });
});

describe("discardStory / reset", () => {
  it("removes a story and drops the emptied epic", () => {
    const store = useProposalStore.getState();
    store.runAuto(idea);
    const epic = planning().proposals[0];
    epic.stories.forEach((s) => store.discardStory(idea.id, epic.id, s.id));
    expect(
      planning().proposals.some((e) => e.id === epic.id),
    ).toBe(false);
  });

  it("reset drops the whole session", () => {
    const store = useProposalStore.getState();
    store.runAuto(idea);
    store.reset(idea.id);
    expect(planning()).toBeUndefined();
  });
});
