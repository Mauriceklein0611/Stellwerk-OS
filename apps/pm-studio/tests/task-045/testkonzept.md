# Testkonzept – TASK-045: Editable Risk Register

Das Risikoregister ist nicht mehr read-only Agenten-Output, sondern manuell
pflegbar: Risiken anlegen, bearbeiten und löschen – mit **Owner**, **Status**,
**Maßnahme** und **Eskalation**. Status-Farbe kommt ausschließlich über
`<StatusBadge>`; bearbeitet wird transaktional über das Save-Patch des
Projekt-Artefakts (`useProjectStore.setRisks`). Agentengenerierte Altrisiken
bleiben über die Persist-Migration (v1→v2) gültig.

## Automatisiert

| Datei | Prüfung |
| --- | --- |
| `risk.test.ts` | Reine Transforms: `createRisk` (injizierte id, Trim, leere optionale Felder → `undefined`), `addRisk` (Append, Blank-Titel ignoriert), `updateRisk` (Felder ersetzt, id erhalten, unbekannte id = no-op), `removeRisk`, `riskFormValues` (Round-Trip), `withRiskStatus` (Backfill „open" / behält expliziten Status), `riskStatusBadge`/`RISK_STATUS` (jeder Status → StatusBadge-Token + Label). |
| `project-store-risks.test.ts` | `useProjectStore.setRisks` ersetzt das Register; no-op ohne Artefakte. Persist-Migration v1→v2: backfillt fehlenden `status` auf „open", behält expliziten Status, no-op bei v2. |
| `RiskTable.test.tsx` | Rendert Owner- + Status-Spalte; Empty-State + „Risiko hinzufügen"; Add-Flow über Dialog ruft `onChange` mit neuem Risiko; Edit-Flow erhält die id. |
| `tests/task-007/RiskTable.test.tsx` | Bestand angepasst (Fixtures um `status`, neues `onChange`-Prop) – Render + StatusBadge-Farbcodierung. |

Ausführen: `npx vitest run tests/task-045`

## Manuell (klickbare Akzeptanz)

Voraussetzung: ein Projekt mit ausgeführter Pipeline (Tab **Risiken** zeigt das
Register). `npm run dev`, Projekt öffnen → Tab **Risiken**.

1. **Risiko anlegen** – „Risiko hinzufügen" klicken, Titel/Owner/Status/
   Wahrscheinlichkeit/Auswirkung/Priorität/Maßnahme/Eskalation füllen, speichern.
   *Erwartet:* neue Zeile mit Owner und Status-Badge erscheint.
2. **Pflichtfeld Titel** – Dialog ohne Titel: „Speichern" ist deaktiviert.
   *Erwartet:* kein leeres Risiko anlegbar.
3. **Bearbeiten** – Stift-Icon einer Zeile, Status z. B. auf „Geschlossen" ändern,
   speichern. *Erwartet:* Status-Badge wird grün; übrige Felder bleiben.
4. **Abbrechen verwirft** – im Edit-Dialog etwas ändern, „Abbrechen".
   *Erwartet:* keine Änderung am Register (transaktional).
5. **Löschen + Undo** – Papierkorb-Icon, im Confirm-Dialog bestätigen.
   *Erwartet:* Zeile verschwindet, Toast „… gelöscht." mit „Rückgängig"; Undo
   stellt die Zeile 1:1 wieder her.
6. **Status-Farbe** – Offen = rot, In Bearbeitung = gelb, Beobachtung = blau,
   Geschlossen = grün (alles über `<StatusBadge>`, keine Ad-hoc-Farben).
7. **Altbestand** – ein vor diesem Feature angelegtes Projekt öffnen.
   *Erwartet:* bestehende (agentengenerierte) Risiken erscheinen mit Status
   „Offen" und sind editierbar (Migration).

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Funktion erfüllt Akzeptanzkriterien (anlegen/bearbeiten/löschen mit Owner,
      Status, Maßnahme, Eskalation; Migration; StatusBadge-only).
- [x] TypeScript strict, kein `any` (eine begründete `exhaustive-deps`-Ausnahme).
- [x] Reine Transforms in `src/lib/risk.ts` unit-getestet.
- [x] Loading-/Empty-States (Tab-Empty bzw. „keine Risiken erfasst").
- [x] Destruktives Löschen über gemeinsame Confirm/Undo-Mechanik (TASK-040).
- [x] Status-Farbe ausschließlich über `<StatusBadge>` / `RISK_STATUS`.
- [x] Doku: `docs/task-index.md`, dieses Testkonzept.
- [x] Gate grün: Lint, Typecheck, Test, Build.
