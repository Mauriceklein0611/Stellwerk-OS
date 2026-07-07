import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  generateBacklogProposals,
  mockAcknowledgement,
  mockFollowUpQuestion,
  mockGreeting,
} from "@/lib/mock-planning";
import {
  removeProposalEpic,
  removeProposalStory,
} from "@/lib/proposals";
import type { PlanningPhase } from "@/lib/pipeline-steps";
import type {
  AgentConversation,
  AgentMessage,
  BacklogEpic,
  ProjectIdea,
} from "@/types";

export type { PlanningPhase };

/** The guided-planning session of one project (TASK-060). */
export type ProjectPlanning = {
  phase: PlanningPhase;
  conversation: AgentConversation;
  /** The one deterministic follow-up was already asked (AC: genau eine Rückfrage). */
  askedFollowUp: boolean;
  /** Scrum proposals waiting in the inbox (empty until the scrum gate). */
  proposals: BacklogEpic[];
  /** The auto run produced these – the panel preselects "Alle übernehmen" (AC). */
  autoMode: boolean;
};

type ProposalState = {
  /** Planning session per project id. */
  byProject: Record<string, ProjectPlanning>;

  /** Start (or restart) a chat-driven planning session for an idea. */
  start: (idea: ProjectIdea) => void;
  /** Post a user message; the mock agent replies deterministically. */
  sendMessage: (idea: ProjectIdea, text: string) => void;
  /** Explicit confirmation: create the draft → gate `draft_review`. */
  createDraft: (idea: ProjectIdea) => void;
  /** Release the draft gate → derive requirements → gate `requirements_review`. */
  approveDraft: (idea: ProjectIdea) => void;
  /** Release the requirements gate → run scrum → proposals land in the inbox. */
  approveRequirements: (idea: ProjectIdea) => void;
  /** Auto mode: run everything at once; result still goes through the inbox. */
  runAuto: (idea: ProjectIdea) => void;

  /** Remove a single proposal story (Verwerfen / after Übernehmen). */
  discardStory: (projectId: string, epicId: string, storyId: string) => void;
  /** Remove a whole proposal epic. */
  discardEpic: (projectId: string, epicId: string) => void;
  /** Empty the inbox (after "Alle übernehmen" / discard-all). */
  clearProposals: (projectId: string) => void;
  /** Drop the whole session for a project (start over). */
  reset: (projectId: string) => void;
};

function message(role: AgentMessage["role"], text: string): AgentMessage {
  return { role, text, at: new Date().toISOString() };
}

function newConversation(idea: ProjectIdea): AgentConversation {
  return {
    id: crypto.randomUUID(),
    projectId: idea.id,
    targetArtifactType: "draft",
    messages: [message("agent", mockGreeting(idea))],
  };
}

/**
 * Guided backlog-planning sessions (TASK-060). Holds the chat conversation, the
 * gate phase and the Scrum proposal inbox per project. It is a **leaf** store:
 * it only depends on pure mock/proposal helpers, never on other stores. The
 * actual promotion of an accepted proposal into the backlog store is done by the
 * AgentPanel (outside this store) so the write stays where the ranks are known
 * and this store keeps no cross-store cycle (TASK-043 pattern).
 */
export const useProposalStore = create<ProposalState>()(
  persist(
    (set) => {
      /** Patch one project's planning; no-op if it doesn't exist yet. */
      const patch = (
        projectId: string,
        fn: (planning: ProjectPlanning) => ProjectPlanning,
      ) =>
        set((state) => {
          const current = state.byProject[projectId];
          if (!current) return state;
          return {
            byProject: { ...state.byProject, [projectId]: fn(current) },
          };
        });

      const appendMessage = (planning: ProjectPlanning, msg: AgentMessage) => ({
        ...planning,
        conversation: {
          ...planning.conversation,
          messages: [...planning.conversation.messages, msg],
        },
      });

      return {
        byProject: {},

        start: (idea) =>
          set((state) => ({
            byProject: {
              ...state.byProject,
              [idea.id]: {
                phase: "chatting",
                conversation: newConversation(idea),
                askedFollowUp: false,
                proposals: [],
                autoMode: false,
              },
            },
          })),

        sendMessage: (idea, text) => {
          const trimmed = text.trim();
          if (!trimmed) return;
          patch(idea.id, (planning) => {
            const withUser = appendMessage(planning, message("user", trimmed));
            // Exactly one deterministic follow-up, then generic acknowledgements.
            const reply = planning.askedFollowUp
              ? mockAcknowledgement()
              : mockFollowUpQuestion(idea);
            return {
              ...appendMessage(withUser, message("agent", reply)),
              askedFollowUp: true,
            };
          });
        },

        createDraft: (idea) =>
          patch(idea.id, (planning) => {
            if (planning.phase !== "chatting") return planning;
            return {
              ...appendMessage(
                planning,
                message(
                  "agent",
                  "Entwurf erstellt. Bitte prüfen und freigeben, dann leite ich die Requirements ab.",
                ),
              ),
              phase: "draft_review",
            };
          }),

        approveDraft: (idea) =>
          patch(idea.id, (planning) => {
            if (planning.phase !== "draft_review") return planning;
            return {
              ...appendMessage(
                planning,
                message(
                  "agent",
                  "Requirements abgeleitet. Bitte prüfen und freigeben, dann erzeuge ich Vorschläge für Epics & Stories.",
                ),
              ),
              phase: "requirements_review",
            };
          }),

        approveRequirements: (idea) =>
          patch(idea.id, (planning) => {
            if (planning.phase !== "requirements_review") return planning;
            const proposals = generateBacklogProposals(idea);
            return {
              ...appendMessage(
                planning,
                message(
                  "agent",
                  "Vorschläge erstellt. Prüfe sie in der Inbox – nichts landet ohne deine Übernahme im Backlog.",
                ),
              ),
              phase: "proposals",
              proposals,
            };
          }),

        runAuto: (idea) => {
          const proposals = generateBacklogProposals(idea);
          set((state) => {
            const existing = state.byProject[idea.id];
            const base = existing ?? {
              phase: "idle" as PlanningPhase,
              conversation: newConversation(idea),
              askedFollowUp: false,
              proposals: [],
              autoMode: false,
            };
            return {
              byProject: {
                ...state.byProject,
                [idea.id]: {
                  ...base,
                  conversation: {
                    ...base.conversation,
                    messages: [
                      ...base.conversation.messages,
                      message(
                        "agent",
                        "Automatisch durchlaufen. Alle Vorschläge liegen in der Inbox und sind zur Übernahme vorausgewählt.",
                      ),
                    ],
                  },
                  phase: "proposals",
                  proposals,
                  autoMode: true,
                },
              },
            };
          });
        },

        discardStory: (projectId, epicId, storyId) =>
          patch(projectId, (planning) => ({
            ...planning,
            proposals: removeProposalStory(planning.proposals, epicId, storyId),
          })),

        discardEpic: (projectId, epicId) =>
          patch(projectId, (planning) => ({
            ...planning,
            proposals: removeProposalEpic(planning.proposals, epicId),
          })),

        clearProposals: (projectId) =>
          patch(projectId, (planning) => ({ ...planning, proposals: [] })),

        reset: (projectId) =>
          set((state) => {
            const next = { ...state.byProject };
            delete next[projectId];
            return { byProject: next };
          }),
      };
    },
    {
      name: "pm-studio-proposals",
      version: 1,
      partialize: (state) => ({ byProject: state.byProject }),
    },
  ),
);
