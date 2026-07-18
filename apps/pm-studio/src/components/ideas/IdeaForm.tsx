"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectStore } from "@/store/useProjectStore";
import {
  APPROACH_LABELS,
  PROJECT_APPROACHES,
  ideaFormDefaults,
  ideaFormSchema,
  ideaFromForm,
  type IdeaFormValues,
} from "@/lib/idea-schema";
import type { ProjectApproach } from "@/types";

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Validated project-idea form. On submit, persists the idea and redirects. */
export function IdeaForm() {
  const router = useRouter();
  const addIdea = useProjectStore((state) => state.addIdea);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues: ideaFormDefaults,
  });

  const onSubmit = (values: IdeaFormValues) => {
    addIdea(ideaFromForm(values));
    router.push("/projects");
  };

  return (
    <Card>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          noValidate
        >
          <Field id="name" label="Projektname" required error={errors.name?.message}>
            <Input
              id="name"
              aria-invalid={!!errors.name}
              placeholder="z. B. Onboarding Revamp"
              {...register("name")}
            />
          </Field>

          <Field
            id="description"
            label="Beschreibung"
            required
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              rows={3}
              aria-invalid={!!errors.description}
              placeholder="Worum geht es bei diesem Projekt?"
              {...register("description")}
            />
          </Field>

          <Field
            id="problem"
            label="Problem"
            required
            error={errors.problem?.message}
          >
            <Textarea
              id="problem"
              rows={3}
              aria-invalid={!!errors.problem}
              placeholder="Welches Problem soll gelöst werden?"
              {...register("problem")}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field id="targetAudience" label="Zielgruppe">
              <Input
                id="targetAudience"
                placeholder="Wer profitiert?"
                {...register("targetAudience")}
              />
            </Field>
            <Field id="benefit" label="Gewünschter Nutzen">
              <Input
                id="benefit"
                placeholder="Welcher Mehrwert entsteht?"
                {...register("benefit")}
              />
            </Field>
          </div>

          <Field
            id="features"
            label="Gewünschte Features"
            hint="Ein Feature pro Zeile."
          >
            <Textarea
              id="features"
              rows={4}
              placeholder={"Feature A\nFeature B\nFeature C"}
              {...register("features")}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field id="timeframe" label="Zeitraum">
              <Input id="timeframe" placeholder="z. B. Q3 2026" {...register("timeframe")} />
            </Field>
            <Field id="budget" label="Budget">
              <Input id="budget" placeholder="z. B. 50.000 €" {...register("budget")} />
            </Field>
            <Field id="teamSize" label="Teamgröße">
              <Input id="teamSize" placeholder="z. B. 5 Personen" {...register("teamSize")} />
            </Field>
            <Field id="approach" label="Gewünschtes Vorgehen" required>
              <Controller
                control={control}
                name="approach"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="approach" className="w-full">
                      <SelectValue>
                        {(value) => APPROACH_LABELS[value as ProjectApproach]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_APPROACHES.map((approach) => (
                        <SelectItem key={approach} value={approach}>
                          {APPROACH_LABELS[approach]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field id="constraints" label="Technische Einschränkungen">
            <Textarea
              id="constraints"
              rows={2}
              placeholder="z. B. On-Premise, DSGVO, Bestandssysteme"
              {...register("constraints")}
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="submit" disabled={isSubmitting}>
              Idee anlegen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
