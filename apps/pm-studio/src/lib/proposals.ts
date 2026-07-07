import { criteriaFromStrings } from "@/lib/acceptance";
import type {
  BacklogEpic,
  BacklogProvenance,
  BacklogStory,
  Epic,
  UserStory,
} from "@/types";

/**
 * Pure, store-free transforms for the backlog agent panel's proposal inbox
 * (TASK-060). The Scrum mock produces {@link BacklogEpic}[] (the run snapshot
 * shape). These helpers convert a *single* accepted proposal into a store
 * {@link Epic}/{@link UserStory} – the panel owns the store writes (ranks come
 * from the current store state) so this stays trivially unit-testable.
 */

/** Total number of proposal stories across all proposal epics. */
export function countProposalStories(epics: BacklogEpic[]): number {
  return epics.reduce((sum, epic) => sum + epic.stories.length, 0);
}

/** Store {@link Epic} from a proposal epic. Id is preserved so accept is idempotent. */
export function epicFromProposal(
  epic: BacklogEpic,
  projectId: string,
  rank: number,
): Epic {
  return { id: epic.id, projectId, title: epic.title, rank };
}

/**
 * Store {@link UserStory} from a proposal story. Id is preserved (so board/sprint
 * `storyId` references stay valid), the artifact's plain-string acceptance
 * criteria are lifted to checkable ones (like `flattenBacklog`). `provenance`
 * defaults to `agent`; accepting via "Bearbeiten" passes `human_edited`.
 */
export function storyFromProposal(
  story: BacklogStory,
  epicId: string,
  projectId: string,
  rank: number,
  provenance: BacklogProvenance = "agent",
): UserStory {
  return {
    id: story.id,
    epicId,
    projectId,
    title: story.title,
    acceptance_criteria: criteriaFromStrings(story.acceptance_criteria),
    estimate_pt: story.estimate_pt,
    priority: story.priority,
    rank,
    provenance,
  };
}

/** Remove a story from a proposal set; drops now-empty epics so the inbox clears. */
export function removeProposalStory(
  epics: BacklogEpic[],
  epicId: string,
  storyId: string,
): BacklogEpic[] {
  return epics
    .map((epic) =>
      epic.id === epicId
        ? { ...epic, stories: epic.stories.filter((s) => s.id !== storyId) }
        : epic,
    )
    .filter((epic) => epic.stories.length > 0);
}

/** Remove a whole epic (with its stories) from a proposal set. */
export function removeProposalEpic(
  epics: BacklogEpic[],
  epicId: string,
): BacklogEpic[] {
  return epics.filter((epic) => epic.id !== epicId);
}
