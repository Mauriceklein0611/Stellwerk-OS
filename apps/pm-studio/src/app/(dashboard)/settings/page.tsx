"use client";

import type { ReactNode } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import {
  SettingsSegment,
  type SegmentOption,
} from "@/components/settings/SettingsSegment";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BoardView } from "@/lib/board";
import { THEME_OPTIONS, type ThemePreference } from "@/lib/theme";
import { useHydrated } from "@/lib/use-hydrated";
import {
  useSettingsStore,
  type MotionPreference,
} from "@/store/useSettingsStore";

const BOARD_VIEW_OPTIONS: SegmentOption<BoardView>[] = [
  { value: "kanban", label: "Kanban" },
  { value: "list", label: "Liste" },
];

const MOTION_OPTIONS: SegmentOption<MotionPreference>[] = [
  { value: "system", label: "System" },
  { value: "full", label: "An" },
  { value: "reduced", label: "Reduziert" },
];

export default function SettingsPage() {
  const hydrated = useHydrated();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const defaultBoardView = useSettingsStore((state) => state.defaultBoardView);
  const setDefaultBoardView = useSettingsStore(
    (state) => state.setDefaultBoardView,
  );
  const motion = useSettingsStore((state) => state.motion);
  const setMotion = useSettingsStore((state) => state.setMotion);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Einstellungen"
        description="Darstellung und Grundeinstellungen der App – lokal gespeichert."
      />

      {!hydrated ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
          Lädt …
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-0 py-0">
            <SettingsRow
              title="Theme"
              description="Hell, dunkel oder der Einstellung deines Systems folgen."
              control={
                <SettingsSegment<ThemePreference>
                  label="Theme"
                  value={theme}
                  options={THEME_OPTIONS}
                  onChange={setTheme}
                />
              }
            />
            <Separator />
            <SettingsRow
              title="Standard-Board-Ansicht"
              description="Ansicht, in der das Board öffnet, solange du dort nicht umschaltest."
              control={
                <SettingsSegment<BoardView>
                  label="Standard-Board-Ansicht"
                  value={defaultBoardView}
                  options={BOARD_VIEW_OPTIONS}
                  onChange={setDefaultBoardView}
                />
              }
            />
            <Separator />
            <SettingsRow
              title="Animationen"
              description="Bewegungen folgen dem System oder werden hier erzwungen bzw. reduziert."
              control={
                <SettingsSegment<MotionPreference>
                  label="Animationen"
                  value={motion}
                  options={MOTION_OPTIONS}
                  onChange={setMotion}
                />
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** A single setting: title + description on the left, control on the right. */
function SettingsRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <p className="max-w-md text-sm text-muted">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
