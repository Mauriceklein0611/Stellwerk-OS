"use client";

import { CheckCheck, Inbox, RotateCcw } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AgentChat } from "@/components/backlog/AgentChat";
import { ProposalCard } from "@/components/backlog/ProposalCard";
import { epicsForProject, storiesForEpic } from "@/lib/backlog";
import {
  countProposalStories,
  epicFromProposal,
  storyFromProposal,
} from "@/lib/proposals";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useProposalStore } from "@/store/useProposalStore";
import type {
  BacklogEpic,
  BacklogProvenance,
  BacklogStory,
  ProjectIdea,
} from "@/types";

type AgentPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Active project; null keeps the panel closed. */
  idea: ProjectIdea | null;
  /** Open the story dialog on a just-accepted story (edit-then-adopt flow). */
  onEditStory: (storyId: string) => void;
};

/**
 * The guided-planning agent panel (TASK-060), docked into `/backlog` as a right
 * Sheet. It hosts the chat entry (draft → gates) and the proposal inbox. The
 * agent never writes to the backlog directly – accepting a proposal here is the
 * only path that promotes it into the backlog store (provenance "agent"), and
 * "Bearbeiten" promotes it as "human_edited" and opens the story dialog. This
 * store-write orchestration lives here (not in the leaf proposal store) so ranks
 * come from the current backlog state.
 */
export function AgentPanel({
  open,
  onOpenChange,
  idea,
  onEditStory,
}: AgentPanelProps) {
  const planning = useProposalStore((state) =>
    idea ? state.byProject[idea.id] : undefined,
  );
  const start = useProposalStore((state) => state.start);
  const sendMessage = useProposalStore((state) => state.sendMessage);
  const createDraft = useProposalStore((state) => state.createDraft);
  const approveDraft = useProposalStore((state) => state.approveDraft);
  const approveRequirements = useProposalStore(
    (state) => state.approveRequirements,
  );
  const runAuto = useProposalStore((state) => state.runAuto);
  const discardStory = useProposalStore((state) => state.discardStory);
  const clearProposals = useProposalStore((state) => state.clearProposals);
  const reset = useProposalStore((state) => state.reset);

  if (!idea) return null;
  // Capture a non-null binding so the nested handlers keep the narrowing
  // (TS doesn't carry `if (!idea)` narrowing into closures).
  const project = idea;

  /** Promote a single proposal story into the backlog store. */
  function acceptStory(
    epic: BacklogEpic,
    story: BacklogStory,
    provenance: BacklogProvenance,
  ) {
    const store = useBacklogStore.getState();
    if (!store.epics.some((e) => e.id === epic.id)) {
      const epicRank = epicsForProject(store.epics, project.id).length;
      store.addEpic(epicFromProposal(epic, project.id, epicRank));
    }
    const storyRank = storiesForEpic(
      useBacklogStore.getState().stories,
      epic.id,
    ).length;
    store.addStory(
      storyFromProposal(story, epic.id, project.id, storyRank, provenance),
    );
    discardStory(project.id, epic.id, story.id);
  }

  function handleAcceptAll() {
    if (!planning) return;
    // Snapshot before mutating (each acceptStory patches the proposal store).
    planning.proposals.forEach((epic) =>
      epic.stories.forEach((story) => acceptStory(epic, story, "agent")),
    );
    clearProposals(project.id);
  }

  function handleEdit(epic: BacklogEpic, story: BacklogStory) {
    acceptStory(epic, story, "human_edited");
    onEditStory(story.id);
    onOpenChange(false);
  }

  const proposalCount = planning ? countProposalStories(planning.proposals) : 0;
  const inInbox = planning?.phase === "proposals";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-4 sm:max-w-md"
        data-testid="agent-panel"
      >
        <SheetHeader className="p-0 pb-3">
          <SheetTitle>Planung mit Agent</SheetTitle>
          <SheetDescription>{project.name}</SheetDescription>
        </SheetHeader>

        {!planning ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="max-w-xs text-sm text-muted">
              Beschreibe deine Idee im Chat. Der Agent stellt eine Rückfrage und
              erstellt erst nach deiner Bestätigung einen Entwurf – Vorschläge
              landen danach in der Inbox.
            </p>
            <Button
              type="button"
              data-testid="agent-panel-start"
              onClick={() => start(project)}
            >
              Planung starten
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="agent-panel-auto"
              onClick={() => runAuto(project)}
              className="text-muted"
            >
              Automatisch durchlaufen
            </Button>
          </div>
        ) : inInbox ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Inbox className="size-4" aria-hidden />
                Vorschläge ({proposalCount})
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="agent-panel-reset"
                onClick={() => reset(project.id)}
                className="text-muted"
              >
                <RotateCcw className="size-4" aria-hidden />
                Neu
              </Button>
            </div>

            {proposalCount === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-muted">
                  Alle Vorschläge bearbeitet.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => reset(project.id)}
                >
                  Planung zurücksetzen
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  data-testid="agent-panel-accept-all"
                  variant={planning.autoMode ? "default" : "outline"}
                  onClick={handleAcceptAll}
                >
                  <CheckCheck className="size-4" aria-hidden />
                  Alle übernehmen
                </Button>

                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                  {planning.proposals.map((epic) => (
                    <div key={epic.id} className="flex flex-col gap-2">
                      {epic.stories.map((story) => (
                        <ProposalCard
                          key={story.id}
                          story={story}
                          epicTitle={epic.title}
                          onAccept={() => acceptStory(epic, story, "agent")}
                          onEdit={() => handleEdit(epic, story)}
                          onDiscard={() =>
                            discardStory(project.id, epic.id, story.id)
                          }
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <AgentChat
            conversation={planning.conversation}
            phase={planning.phase}
            onSend={(text) => sendMessage(project, text)}
            onCreateDraft={() => createDraft(project)}
            onApproveDraft={() => approveDraft(project)}
            onApproveRequirements={() => approveRequirements(project)}
            onRunAuto={() => runAuto(project)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
