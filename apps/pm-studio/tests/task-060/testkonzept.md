# Testkonzept – TASK-060: Agenten-Panel im Backlog (Chat + Vorschlags-Inbox)

Mockup des artefakt-zentrierten Agenten-Erlebnisses im `/backlog`-Bereich: rechte
Agenten-Seitenleiste (Sheet) mit Chat-Einstieg, Gate-Stepper und Vorschlags-Inbox.
Der Agent schreibt **nie** direkt ins Backlog – Vorschläge werden einzeln
übernommen, bearbeitet oder verworfen.

## Automatisiert

| Datei | Prüfung |
|---|---|
| `proposals.test.ts` | Reine Transforms: `countProposalStories`, `epicFromProposal` (Id + Rank), `storyFromProposal` (Provenienz `agent`/`human_edited`, `string[]`-AK → abhakbar, Blanks raus), `removeProposalStory` (leeres Epic fällt weg), `removeProposalEpic`. |
| `provenance.test.ts` | `PROVENANCE_META`: `agent`→info „Agent", `human_edited`→warning „bearbeitet", `human`→kein Badge. |
| `pipeline-steps.test.ts` | `stepStatusesForPhase` je Phase: idle=pending, chatting=draft running, draft_review/requirements_review halten auf `awaiting_review` (Gate), proposals=scrum `awaiting_review`; ohne offene Vorschläge scrum `done`. |
| `useProposalStore.test.ts` | Chat: `start` (ein Greeting, Phase chatting), `sendMessage` stellt **genau eine** deterministische Rückfrage, dann Acknowledgement; leere Eingabe ignoriert. Gates: `createDraft` nur aus chatting, `approveDraft` nur aus draft_review, `approveRequirements` erzeugt Vorschläge nur aus requirements_review. `runAuto` füllt Inbox + `autoMode`. `discardStory` (leeres Epic weg), `reset`. |
| `AgentPanel.test.tsx` | Inbox-Flows gegen den echten Backlog-Store: Start-CTA erzeugt kein Backlog (Entwurf erst nach Bestätigung); **Übernehmen** schreibt eine Story mit Provenienz `agent` + legt das Epic an, Vorschlag verlässt die Inbox; **Verwerfen** lässt das Backlog unangetastet; **Alle übernehmen** übernimmt alle + leert die Inbox; **Bearbeiten** übernimmt als `human_edited`, ruft `onEditStory` und schließt das Panel. |
| `e2e/backlog.spec.ts` (TASK-060-Fall) | Auf leerem Projekt: Panel öffnen → „Automatisch durchlaufen" füllt die Inbox, **Backlog bleibt leer** (Beweis „kein ungefragtes Schreiben"); „Alle übernehmen" macht daraus echte Stories mit sichtbarer „Agent"-Provenienz; überlebt Reload. |

Gate: `npm run lint` (0 Errors), `npx tsc --noEmit`, `npm run test` (597 grün), `npm run build`, `npx playwright test e2e/backlog.spec.ts` (6 grün).

## Manuell (Klick-Checkliste)

Voraussetzung: mind. eine Projektidee vorhanden. Bereich **Umsetzung → Backlog** öffnen.

1. **Panel öffnen:** Button „Planung mit Agent" (Kopf) oder bei leerem Backlog „Planung mit Agent starten". → Rechtes Panel erscheint. ✅
2. **Chat + eine Rückfrage:** „Planung starten" → Agent begrüßt. Eine Nachricht senden → Agent stellt **genau eine** Rückfrage. Weitere Nachricht → nur noch Bestätigung, keine zweite Frage. ✅
3. **Gate Entwurf:** „Entwurf erstellen" → Kopf-Stepper zeigt „Draft" mit Uhr-Symbol (awaiting_review). Ohne „Entwurf freigeben" läuft kein Folgeschritt. ✅
4. **Gate Requirements:** „Entwurf freigeben" → „Requirements" hält auf awaiting_review. „Requirements freigeben" → Vorschläge erscheinen in der Inbox, „Scrum" auf awaiting_review. ✅
5. **Inbox – Übernehmen:** Eine Karte „Übernehmen" → Story erscheint im Backlog **mit Badge „Agent"**; Karte verschwindet aus der Inbox. ✅
6. **Inbox – Bearbeiten:** „Bearbeiten" → Panel schließt, Story-Dialog öffnet vorbefüllt. Speichern → Story trägt Badge **„bearbeitet"** (human_edited). ✅
7. **Inbox – Verwerfen:** „Verwerfen" → Karte weg, **nichts** landet im Backlog. ✅
8. **Alle übernehmen / Auto:** „Automatisch durchlaufen" (sekundär) → alle Vorschläge in der Inbox, „Alle übernehmen" hervorgehoben. Klick → alle Stories im Backlog (Provenienz „Agent"). ✅
9. **Persistenz:** Reload → übernommene Stories inkl. Provenienz bleiben; offene Vorschläge/Chat-Session bleiben erhalten (persist light). ✅
10. **Manuelle Stories:** Von Hand angelegte Stories tragen **kein** Provenienz-Badge (kein Rauschen). ✅

## DoD-Abgleich (`docs/testing-strategy.md`)

- [x] Akzeptanzkriterien erfüllt (Panel öffenbar; Entwurf erst nach Bestätigung; Gates ohne Freigabe blockieren; Vorschläge nur nach Übernehmen/Bearbeiten im Backlog, Verwerfen hinterlässt nichts; Provenienz sichtbar; kein Mock-Pfad im Panel schreibt ungefragt).
- [x] Automatisierte Tests (Unit: proposals/provenance/pipeline-steps/store; Komponente: AgentPanel-Inbox; E2E: Panel-Happy-Path) + dieses Testkonzept.
- [x] TypeScript strict, kein `any`; Status-Farbe nur über `<StatusBadge>` (PROVENANCE_META); Loading/Empty-States im Panel.
- [x] Keine neue Dependency, keine Persist-Migration bestehender Stores (neuer `pm-studio-proposals`-Store v1, additiv).
- [x] Architektur-Seam gewahrt: die Mock-Content-Funktionen liegen in `lib/mock-planning.ts`, **nicht** in `mock-agent-service.ts` (Guard `tests/task-009/architecture.test.ts` bleibt grün); der Leaf-Store importiert keine anderen Stores.
- [x] Gate grün (lint/tsc/test/build/E2E).

## Bewusste Grenzen / Architektur

- **Scope „Nur Agent-Panel":** Der bestehende Batch-Lauf `runPipelineForIdea` (ProjectDetail „Pipeline ausführen") bleibt **unverändert** und importiert weiterhin direkt (Legacy-Auto-Modus). Das AC „kein Mock-Pfad schreibt ungefragt" gilt für das neue Panel-Erlebnis (bewusste Nutzer-Entscheidung, hält CLAUDE.md-Scope + Bestandstest `tests/task-009/pipeline-store.test.ts`).
- **Übernahme-Orchestrierung** (Proposal → Backlog-Store) liegt im `AgentPanel`, nicht im Leaf-`useProposalStore` – so kommen die Ränge aus dem aktuellen Backlog-Zustand und es entsteht kein Store-Init-Zyklus (Muster TASK-043).
- **Bearbeiten = übernehmen + editieren:** Die Karte wird als `human_edited` in den Store geschrieben und dann im TASK-058-Dialog geöffnet; Abbrechen lässt sie als `human_edited` im Backlog (bewusst – die Kuratierung durch den Menschen ist bereits erfolgt).
- **Draft/Requirements-Artefakte** werden im Mockup nicht persistiert; die Vorschläge werden bei der Scrum-Freigabe deterministisch aus der Idee neu erzeugt (`draft → requirements → scrum`), was Zwischenstände überflüssig macht.
