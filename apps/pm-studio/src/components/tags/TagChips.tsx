import { tagColorStyle } from "@/lib/tags";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";

type TagChipsProps = {
  tags: Tag[];
  /** Show at most this many chips; the rest collapse into a "+N" pill. */
  max?: number;
  className?: string;
};

/**
 * Compact, token-colored tag chips for cards and list rows (TASK-031). Overflow
 * beyond `max` collapses into a "+N" pill so the layout stays tight.
 */
export function TagChips({ tags, max = 3, className }: TagChipsProps) {
  if (tags.length === 0) return null;

  const visible = tags.slice(0, max);
  const overflow = tags.length - visible.length;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visible.map((tag) => (
        <span
          key={tag.id}
          className={cn(
            "max-w-32 truncate rounded-full px-2 py-0.5 text-xs font-medium",
            tagColorStyle(tag.color).chip,
          )}
        >
          {tag.name}
        </span>
      ))}
      {overflow > 0 && (
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          +{overflow}
        </span>
      )}
    </div>
  );
}
