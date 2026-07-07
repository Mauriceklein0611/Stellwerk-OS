import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useBoardStore } from "@/store/useBoardStore";
import type { Tag } from "@/types";

type TagState = {
  tags: Tag[];
  addTag: (tag: Tag) => void;
  updateTag: (id: string, patch: Partial<Omit<Tag, "id">>) => void;
  /**
   * Remove a tag and detach it from every board task (TASK-031): the tag must
   * not linger as a dangling id on any item, analog to Team→Person (TASK-019).
   */
  removeTag: (id: string) => void;
};

/**
 * Free-form tags/labels for backlog and board items (TASK-031). Persisted
 * locally; assignment lives on `BoardTask.tagIds`. Colors come from the fixed
 * token palette in `src/lib/tags.ts` (no ad-hoc colors).
 */
export const useTagStore = create<TagState>()(
  persist(
    (set) => ({
      tags: [],
      addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
      updateTag: (id, patch) =>
        set((state) => ({
          tags: state.tags.map((tag) =>
            tag.id === id ? { ...tag, ...patch } : tag,
          ),
        })),
      removeTag: (id) => {
        set((state) => ({ tags: state.tags.filter((tag) => tag.id !== id) }));
        // Detach the deleted tag from all board tasks so nothing dangles.
        useBoardStore.getState().detachTag(id);
      },
    }),
    {
      name: "pm-studio-tags",
      version: 1,
      partialize: (state) => ({ tags: state.tags }),
    },
  ),
);
