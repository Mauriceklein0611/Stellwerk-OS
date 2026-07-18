"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  reviewFormDefaults,
  reviewFormSchema,
  reviewFromForm,
  type ReviewFormValues,
} from "@/lib/sprint-review-schema";
import type { ReviewContent, SprintReview } from "@/types";

type ReviewFormProps = {
  sprintId: string;
  /** Existing review to prefill; undefined → empty form. */
  review?: SprintReview;
  /** Planned story-points, derived from the sprint assignment (read-only). */
  plannedPt: number;
  /** Called with the review content on save; the caller adds ceremony metadata. */
  onSave: (content: ReviewContent) => void;
};

/** Sprint-review form: what was delivered, achieved vs. planned PT, notes (TASK-018). */
export function ReviewForm({ sprintId, review, plannedPt, onSave }: ReviewFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: reviewFormDefaults(review),
  });

  const onSubmit = (values: ReviewFormValues) => {
    onSave(reviewFromForm(sprintId, values));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-delivered">
          Was wurde geliefert <span className="text-danger">*</span>
        </Label>
        <Textarea
          id="review-delivered"
          rows={3}
          aria-invalid={!!errors.delivered}
          placeholder="Welche Stories/Ergebnisse hat der Sprint geliefert?"
          {...register("delivered")}
        />
        {errors.delivered && (
          <p className="text-xs text-danger">{errors.delivered.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-achieved">
          Erreichte Story-Points <span className="text-danger">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="review-achieved"
            type="number"
            min={0}
            step={1}
            className="w-28"
            aria-invalid={!!errors.achievedPt}
            {...register("achievedPt", { valueAsNumber: true })}
          />
          <span className="text-xs text-muted">
            von {plannedPt} geplanten PT
          </span>
        </div>
        {errors.achievedPt && (
          <p className="text-xs text-danger">{errors.achievedPt.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-notes">Notizen</Label>
        <Textarea
          id="review-notes"
          rows={2}
          placeholder="Optionale Anmerkungen zum Sprint-Ergebnis."
          {...register("notes")}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
        {isSubmitSuccessful && (
          <span className="text-xs text-success" role="status">
            Review gespeichert.
          </span>
        )}
        <Button type="submit" disabled={isSubmitting}>
          Review speichern
        </Button>
      </div>
    </form>
  );
}
