"use client";

import { type KeyboardEvent, useState } from "react";
import { Send, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AgentConversation } from "@/types";
import type { PlanningPhase } from "@/lib/pipeline-steps";

type AgentChatProps = {
  conversation: AgentConversation;
  phase: PlanningPhase;
  onSend: (text: string) => void;
  onCreateDraft: () => void;
  onApproveDraft: () => void;
  onApproveRequirements: () => void;
  onRunAuto: () => void;
};

/**
 * Chat surface of the agent panel (TASK-060). Renders the conversation
 * transcript and the phase-appropriate footer: a composer + "Entwurf erstellen"
 * while chatting, a gate-release button while a draft/requirements result is
 * awaiting review. "Automatisch durchlaufen" (auto mode) stays reachable as a
 * secondary action in every conversation phase.
 */
export function AgentChat({
  conversation,
  phase,
  onSend,
  onCreateDraft,
  onApproveDraft,
  onApproveRequirements,
  onRunAuto,
}: AgentChatProps) {
  const [draft, setDraft] = useState("");

  const send = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        data-testid="agent-chat-transcript"
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1"
      >
        {conversation.messages.map((msg, index) => (
          <div
            key={index}
            data-role={msg.role}
            className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
              msg.role === "agent"
                ? "self-start bg-secondary text-foreground"
                : "self-end bg-primary/10 text-foreground",
            )}
          >
            {msg.role === "agent" && (
              <span className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-muted">
                <Sparkles className="size-3" aria-hidden /> Agent
              </span>
            )}
            {msg.text}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        {phase === "chatting" && (
          <>
            <div className="flex items-center gap-2">
              <Input
                data-testid="agent-chat-input"
                aria-label="Nachricht an den Agenten"
                placeholder="Idee oder Feedback beschreiben …"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9"
              />
              <Button
                type="button"
                size="icon"
                aria-label="Senden"
                data-testid="agent-chat-send"
                onClick={send}
                disabled={!draft.trim()}
              >
                <Send className="size-4" aria-hidden />
              </Button>
            </div>
            <Button
              type="button"
              data-testid="agent-chat-create-draft"
              onClick={onCreateDraft}
            >
              Entwurf erstellen
            </Button>
          </>
        )}

        {phase === "draft_review" && (
          <Button
            type="button"
            data-testid="agent-chat-approve-draft"
            onClick={onApproveDraft}
          >
            Entwurf freigeben
          </Button>
        )}

        {phase === "requirements_review" && (
          <Button
            type="button"
            data-testid="agent-chat-approve-requirements"
            onClick={onApproveRequirements}
          >
            Requirements freigeben
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="agent-chat-run-auto"
          onClick={onRunAuto}
          className="text-muted"
        >
          <Wand2 className="size-4" aria-hidden />
          Automatisch durchlaufen
        </Button>
      </div>
    </div>
  );
}
