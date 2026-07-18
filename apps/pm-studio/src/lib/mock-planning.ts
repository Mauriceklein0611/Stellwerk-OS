import {
  buildBacklog,
  buildDraft,
  buildRequirements,
} from "@/data/mock-templates";
import type { BacklogEpic, ProjectIdea } from "@/types";

/**
 * Deterministic, synchronous mock helpers for the backlog agent panel
 * (TASK-060). Deliberately separate from `mock-agent-service.ts`: that file is
 * the async {@link AgentService} seam that only the composition root
 * (`agent-service.ts`) may import (architecture guard). These are pure content
 * generators – the leaf proposal store can import them without a store cycle and
 * without touching the service seam. They reuse the same Scrum-mock chain the
 * pipeline runs, so the panel produces identical items – just as reviewable
 * proposals instead of a direct import.
 */

/**
 * The single deterministic follow-up question the idea agent asks in the chat.
 * References the idea so the mockup feels responsive, but stays deterministic.
 */
export function mockFollowUpQuestion(idea: ProjectIdea): string {
  return `Verstanden. Wer ist die wichtigste Zielgruppe für „${idea.name}“ – und was soll sie am Ende können?`;
}

/**
 * A generic acknowledgement the agent gives once the single follow-up was
 * already asked. Deterministic; no further questions (AC: genau eine Rückfrage).
 */
export function mockAcknowledgement(): string {
  return "Danke, das hilft. Wenn du bereit bist, erstelle ich daraus einen Entwurf.";
}

/** The agent's opening message when a planning conversation starts. */
export function mockGreeting(idea: ProjectIdea): string {
  return `Lass uns „${idea.name}“ gemeinsam schärfen. Beschreibe die Idee oder dein Feedback – ich stelle eine kurze Rückfrage und erstelle dann einen Entwurf.`;
}

/**
 * Generate the Scrum-agent backlog proposals (epics with nested stories) for an
 * idea, reusing the exact deterministic mock chain the pipeline runs
 * (draft → requirements → scrum).
 */
export function generateBacklogProposals(idea: ProjectIdea): BacklogEpic[] {
  const draft = buildDraft(idea);
  const requirements = buildRequirements(draft);
  return buildBacklog(requirements).epics;
}
