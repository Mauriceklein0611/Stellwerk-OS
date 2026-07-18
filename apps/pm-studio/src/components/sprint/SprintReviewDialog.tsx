"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewForm } from "@/components/sprint/ReviewForm";
import { RetroForm } from "@/components/sprint/RetroForm";
import type {
  PlannedSprint,
  RetroContent,
  ReviewContent,
} from "@/types";

type SprintReviewDialogProps = {
  open: boolean;
  /** Sprint being reviewed; null while closed. */
  sprint: PlannedSprint | null;
  /** Planned story-points, derived from the sprint assignment (read-only). */
  plannedPt: number;
  onOpenChange: (open: boolean) => void;
  /** Save review content; the caller adds ceremony metadata (TASK-054). */
  onSaveReview: (content: ReviewContent) => void;
  /** Save retro content; the caller adds ceremony metadata (TASK-054). */
  onSaveRetro: (content: RetroContent) => void;
};

/**
 * Dialog hosting a sprint's review and retrospective forms in two tabs (TASK-018).
 * Keyed by sprint id in the body so the forms re-initialize per sprint.
 */
export function SprintReviewDialog({
  open,
  sprint,
  plannedPt,
  onOpenChange,
  onSaveReview,
  onSaveRetro,
}: SprintReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open && sprint && (
          <div key={sprint.id} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Review &amp; Retro · {sprint.name}</DialogTitle>
              <DialogDescription>
                Sprint-Ergebnis reflektieren – jeder Eintrag wird als neuer
                Eintrag zur Historie hinzugefügt (alle im Bereich Ceremonies).
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="review">
              <TabsList className="w-full">
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="retro">Retro</TabsTrigger>
              </TabsList>
              <TabsContent value="review" className="pt-4">
                <ReviewForm
                  sprintId={sprint.id}
                  plannedPt={plannedPt}
                  onSave={onSaveReview}
                />
              </TabsContent>
              <TabsContent value="retro" className="pt-4">
                <RetroForm sprintId={sprint.id} onSave={onSaveRetro} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
