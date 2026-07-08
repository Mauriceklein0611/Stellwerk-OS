import { describe, expect, it } from "vitest";

import {
  countProposalStories,
  epicFromProposal,
  removeProposalEpic,
  removeProposalStory,
  storyFromProposal,
} from "@/lib/proposals";
import type { BacklogEpic, BacklogStory } from "@/types";

/**
 * TASK-060: pure transforms for the proposal inbox. No store, so trivially
 * testable. Cover the story→UserStory promotion (provenance + lifted AKs) and
 * the inbox removal that drops emptied epics.
 */

const story: BacklogStory = {
  id: "US-1",
  title: "Login",
  acceptance_criteria: ["AK eins", "  ", "AK zwei"],
  estimate_pt: 3,
  priority: "hoch",
};

const epic: BacklogEpic = {
  id: "E-1",
  title: "Kern",
  stories: [story, { ...story, id: "US-2", title: "Logout" }],
};

describe("countProposalStories", () => {
  it("counts stories across all proposal epics", () => {
    expect(countProposalStories([epic])).toBe(2);
    expect(countProposalStories([])).toBe(0);
  });
});

describe("epicFromProposal", () => {
  it("keeps the epic id and applies project + rank", () => {
    expect(epicFromProposal(epic, "p1", 2)).toEqual({
      id: "E-1",
      projectId: "p1",
      title: "Kern",
      rank: 2,
    });
  });
});

describe("storyFromProposal", () => {
  it("promotes a proposal story with provenance agent and checkable AKs", () => {
    const result = storyFromProposal(story, "E-1", "p1", 0);
    expect(result).toMatchObject({
      id: "US-1",
      epicId: "E-1",
      projectId: "p1",
      title: "Login",
      estimate_pt: 3,
      priority: "hoch",
      rank: 0,
      provenance: "agent",
    });
    // Plain-string AKs are lifted to checkable ones; blanks dropped.
    expect(result.acceptance_criteria.map((c) => c.text)).toEqual([
      "AK eins",
      "AK zwei",
    ]);
    expect(result.acceptance_criteria.every((c) => !c.done)).toBe(true);
  });

  it("accepts an explicit provenance (edit-then-adopt → human_edited)", () => {
    expect(storyFromProposal(story, "E-1", "p1", 0, "human_edited").provenance).toBe(
      "human_edited",
    );
  });
});

describe("removeProposalStory", () => {
  it("removes a story and keeps the epic while it still has stories", () => {
    const next = removeProposalStory([epic], "E-1", "US-1");
    expect(next).toHaveLength(1);
    expect(next[0].stories.map((s) => s.id)).toEqual(["US-2"]);
  });

  it("drops the epic once its last story is removed", () => {
    let next = removeProposalStory([epic], "E-1", "US-1");
    next = removeProposalStory(next, "E-1", "US-2");
    expect(next).toEqual([]);
  });
});

describe("removeProposalEpic", () => {
  it("removes the whole epic with its stories", () => {
    expect(removeProposalEpic([epic], "E-1")).toEqual([]);
  });
});
