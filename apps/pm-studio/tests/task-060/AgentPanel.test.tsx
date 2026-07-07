import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AgentPanel } from "@/components/backlog/AgentPanel";
import { useProposalStore, type ProjectPlanning } from "@/store/useProposalStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useActivityStore } from "@/store/useActivityStore";
import type { BacklogEpic, ProjectIdea } from "@/types";

/**
 * TASK-060: the agent panel inbox. Proves the core AC "kein Mock-Pfad schreibt
 * ungefragt ins Backlog": nothing reaches the backlog store until a proposal is
 * accepted, accepted items carry provenance (agent / human_edited) and Verwerfen
 * leaves nothing behind.
 */

const idea: ProjectIdea = {
  id: "p1",
  createdAt: new Date().toISOString(),
  status: "idea",
  name: "Planner",
  description: "desc",
  problem: "problem",
  features: ["A"],
  approach: "agil",
};

const epic: BacklogEpic = {
  id: "E-1",
  title: "Kern",
  stories: [
    { id: "US-1", title: "Login", acceptance_criteria: ["AK"], estimate_pt: 3, priority: "hoch" },
    { id: "US-2", title: "Logout", acceptance_criteria: [], estimate_pt: 2, priority: "mittel" },
  ],
};

function seedInbox(proposals: BacklogEpic[] = [epic]) {
  const planning: ProjectPlanning = {
    phase: "proposals",
    conversation: {
      id: "c1",
      projectId: idea.id,
      targetArtifactType: "draft",
      messages: [],
    },
    askedFollowUp: true,
    proposals,
    autoMode: false,
  };
  useProposalStore.setState({ byProject: { [idea.id]: planning } });
}

const backlog = () => useBacklogStore.getState();
const inbox = () => useProposalStore.getState().byProject[idea.id];

beforeEach(() => {
  useProposalStore.setState({ byProject: {} });
  useBacklogStore.setState({ epics: [], stories: [], artifactsMigrated: true });
  useActivityStore.setState({ events: [] });
});

describe("AgentPanel inbox", () => {
  it("shows the start CTA when no session exists and starts on click", () => {
    render(
      <AgentPanel open idea={idea} onOpenChange={vi.fn()} onEditStory={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId("agent-panel-start"));
    expect(inbox().phase).toBe("chatting");
    // Draft is created only after explicit confirmation, not on start.
    expect(backlog().stories).toHaveLength(0);
  });

  it("Übernehmen promotes one story into the backlog with provenance agent", () => {
    seedInbox();
    render(
      <AgentPanel open idea={idea} onOpenChange={vi.fn()} onEditStory={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId("proposal-accept-US-1"));

    const story = backlog().stories.find((s) => s.id === "US-1");
    expect(story?.provenance).toBe("agent");
    expect(backlog().epics.some((e) => e.id === "E-1")).toBe(true);
    // The accepted proposal left the inbox; the other stays.
    expect(inbox().proposals[0].stories.map((s) => s.id)).toEqual(["US-2"]);
  });

  it("Verwerfen removes a proposal without touching the backlog", () => {
    seedInbox();
    render(
      <AgentPanel open idea={idea} onOpenChange={vi.fn()} onEditStory={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId("proposal-discard-US-2"));

    expect(backlog().stories).toHaveLength(0);
    expect(inbox().proposals[0].stories.map((s) => s.id)).toEqual(["US-1"]);
  });

  it("Alle übernehmen promotes every proposal and clears the inbox", () => {
    seedInbox();
    render(
      <AgentPanel open idea={idea} onOpenChange={vi.fn()} onEditStory={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId("agent-panel-accept-all"));

    expect(backlog().stories.map((s) => s.id).sort()).toEqual(["US-1", "US-2"]);
    expect(inbox().proposals).toEqual([]);
  });

  it("Bearbeiten adopts as human_edited, opens the dialog and closes the panel", () => {
    seedInbox();
    const onEditStory = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <AgentPanel
        open
        idea={idea}
        onOpenChange={onOpenChange}
        onEditStory={onEditStory}
      />,
    );
    fireEvent.click(screen.getByTestId("proposal-edit-US-1"));

    expect(backlog().stories.find((s) => s.id === "US-1")?.provenance).toBe(
      "human_edited",
    );
    expect(onEditStory).toHaveBeenCalledWith("US-1");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
