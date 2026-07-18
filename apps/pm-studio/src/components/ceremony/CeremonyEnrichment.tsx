"use client";

import { useState } from "react";
import Link from "next/link";
import { Link2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  commentsChronological,
  createComment,
  resolveLinks,
  type ResolvedLink,
} from "@/lib/ceremonies";
import type { CeremonyComment } from "@/types";

/** A pickable sprint item (story or board task). */
export type LinkableItem = { id: string; title: string };

type CeremonyEnrichmentProps = {
  /** Sprint the ceremony belongs to – linked items navigate to its detail page. */
  sprintId: string;
  linkedStoryIds?: string[];
  linkedTaskIds?: string[];
  comments?: CeremonyComment[];
  /** Stories of the sprint, offered in the picker. */
  availableStories: LinkableItem[];
  /** Board tasks of the sprint, offered in the picker. */
  availableTasks: LinkableItem[];
  onToggleStory: (storyId: string) => void;
  onToggleTask: (taskId: string) => void;
  onAddComment: (comment: CeremonyComment) => void;
  onRemoveComment: (commentId: string) => void;
};

function formatCommentDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Interactive extras of a ceremony entry (TASK-055): linked sprint items
 * (stories/tasks that navigate to the sprint detail) and a comment thread.
 * Presentational – all persistence runs through the passed callbacks.
 */
export function CeremonyEnrichment({
  sprintId,
  linkedStoryIds,
  linkedTaskIds,
  comments,
  availableStories,
  availableTasks,
  onToggleStory,
  onToggleTask,
  onAddComment,
  onRemoveComment,
}: CeremonyEnrichmentProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");

  const linkedStories = resolveLinks(linkedStoryIds, availableStories);
  const linkedTasks = resolveLinks(linkedTaskIds, availableTasks);
  const orderedComments = commentsChronological(comments);
  const hasLinks = linkedStories.length > 0 || linkedTasks.length > 0;
  const hasPickable = availableStories.length > 0 || availableTasks.length > 0;

  const sprintHref = `/sprints/${sprintId}`;
  const storyIdSet = new Set(linkedStoryIds ?? []);
  const taskIdSet = new Set(linkedTaskIds ?? []);

  function submitComment() {
    const comment = createComment({ author, text });
    if (!comment) return;
    onAddComment(comment);
    setText("");
  }

  return (
    <div
      data-testid="ceremony-enrichment"
      className="mt-4 flex flex-col gap-4 border-t border-border pt-4"
    >
      {/* Linked items ------------------------------------------------ */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            Verknüpfte Items
          </span>
          {hasPickable && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              data-testid="ceremony-link-picker"
              onClick={() => setPickerOpen((open) => !open)}
            >
              <Link2 className="mr-1 size-3" />
              Verknüpfen
            </Button>
          )}
        </div>

        {hasLinks ? (
          <ul className="flex flex-wrap gap-1.5">
            {linkedStories.map((item) => (
              <LinkChip
                key={`story-${item.id}`}
                item={item}
                href={sprintHref}
                kindLabel="Story"
                onRemove={() => onToggleStory(item.id)}
              />
            ))}
            {linkedTasks.map((item) => (
              <LinkChip
                key={`task-${item.id}`}
                item={item}
                href={sprintHref}
                kindLabel="Task"
                onRemove={() => onToggleTask(item.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">Keine Items verknüpft.</p>
        )}

        {pickerOpen && hasPickable && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/40 p-3">
            <PickerGroup
              label="Stories"
              items={availableStories}
              selected={storyIdSet}
              onToggle={onToggleStory}
              prefix="story"
            />
            <PickerGroup
              label="Tasks"
              items={availableTasks}
              selected={taskIdSet}
              onToggle={onToggleTask}
              prefix="task"
            />
          </div>
        )}
      </section>

      {/* Comments ---------------------------------------------------- */}
      <section className="flex flex-col gap-2">
        <span className="text-xs font-medium text-foreground">Kommentare</span>

        {orderedComments.length > 0 ? (
          <ul className="flex flex-col gap-2" data-testid="ceremony-comments">
            {orderedComments.map((comment) => (
              <li
                key={comment.id}
                data-testid={`ceremony-comment-${comment.id}`}
                className="flex items-start gap-2 rounded-lg bg-secondary/40 px-3 py-2"
              >
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {comment.author}
                    </span>
                    <span className="text-[11px] text-muted">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs text-muted">
                    {comment.text}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Kommentar entfernen"
                  data-testid={`ceremony-comment-remove-${comment.id}`}
                  className="text-muted transition-colors hover:text-foreground"
                  onClick={() => onRemoveComment(comment.id)}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">Noch keine Kommentare.</p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <Input
            placeholder="Name (optional)"
            aria-label="Autor"
            data-testid="ceremony-comment-author"
            className="sm:max-w-[10rem]"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
          />
          <Input
            placeholder="Kommentar …"
            aria-label="Kommentar"
            data-testid="ceremony-comment-input"
            className="flex-1"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitComment();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            className="h-8"
            data-testid="ceremony-comment-submit"
            disabled={!text.trim()}
            onClick={submitComment}
          >
            <Plus className="mr-1 size-3" />
            Hinzufügen
          </Button>
        </div>
      </section>
    </div>
  );
}

function LinkChip({
  item,
  href,
  kindLabel,
  onRemove,
}: {
  item: ResolvedLink;
  href: string;
  kindLabel: string;
  onRemove: () => void;
}) {
  return (
    <li
      data-testid={`ceremony-link-${item.id}`}
      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
    >
      {item.missing ? (
        <span className="text-muted line-through" title="Item wurde gelöscht">
          {item.label}
        </span>
      ) : (
        <Link href={href} className="text-foreground hover:underline">
          <span className="text-muted">{kindLabel}: </span>
          {item.label}
        </Link>
      )}
      <button
        type="button"
        aria-label="Verknüpfung entfernen"
        data-testid={`ceremony-unlink-${item.id}`}
        className="text-muted transition-colors hover:text-foreground"
        onClick={onRemove}
      >
        <X className="size-3" />
      </button>
    </li>
  );
}

function PickerGroup({
  label,
  items,
  selected,
  onToggle,
  prefix,
}: {
  label: string;
  items: LinkableItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  prefix: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-[11px] text-muted">
        {label}: keine im Sprint.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const isSelected = selected.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`ceremony-link-option-${prefix}-${item.id}`}
              aria-pressed={isSelected}
              onClick={() => onToggle(item.id)}
              className={
                "rounded-full border px-2 py-0.5 text-xs transition-colors " +
                (isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted hover:text-foreground")
              }
            >
              {item.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
