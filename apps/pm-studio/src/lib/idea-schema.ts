import { z } from "zod";

import type { ProjectApproach, ProjectIdea } from "@/types";

export const PROJECT_APPROACHES = ["agil", "klassisch", "hybrid"] as const;

export const APPROACH_LABELS: Record<ProjectApproach, string> = {
  agil: "Agil",
  klassisch: "Klassisch",
  hybrid: "Hybrid",
};

/** Validation schema for the project-idea form (UI strings, German messages). */
export const ideaFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Projektname ist erforderlich")
    .max(120, "Maximal 120 Zeichen"),
  description: z.string().trim().min(1, "Beschreibung ist erforderlich"),
  targetAudience: z.string().trim().optional(),
  problem: z.string().trim().min(1, "Problem ist erforderlich"),
  benefit: z.string().trim().optional(),
  /** One feature per line; split into a list on submit. */
  features: z.string().optional(),
  timeframe: z.string().trim().optional(),
  budget: z.string().trim().optional(),
  teamSize: z.string().trim().optional(),
  constraints: z.string().trim().optional(),
  approach: z.enum(PROJECT_APPROACHES),
});

export type IdeaFormValues = z.infer<typeof ideaFormSchema>;

/** Empty form defaults (approach pre-selected so the Select always has a value). */
export const ideaFormDefaults: IdeaFormValues = {
  name: "",
  description: "",
  targetAudience: "",
  problem: "",
  benefit: "",
  features: "",
  timeframe: "",
  budget: "",
  teamSize: "",
  constraints: "",
  approach: "agil",
};

/** Split a multiline feature input into a trimmed, non-empty list. */
export function parseFeatures(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Build a persisted ProjectIdea from validated form values. */
export function ideaFromForm(values: IdeaFormValues): ProjectIdea {
  const optional = (value: string | undefined) => value?.trim() || undefined;

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "idea",
    name: values.name.trim(),
    description: values.description.trim(),
    targetAudience: optional(values.targetAudience),
    problem: values.problem.trim(),
    benefit: optional(values.benefit),
    features: parseFeatures(values.features),
    timeframe: optional(values.timeframe),
    budget: optional(values.budget),
    teamSize: optional(values.teamSize),
    constraints: optional(values.constraints),
    approach: values.approach,
  };
}
