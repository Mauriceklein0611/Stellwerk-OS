# Testkonzept – TASK-017: Sprintübersicht & Sprint-Planung

`/sprints` ist jetzt eine interaktive Planungsansicht: Sprints pro Projekt
anlegen/bearbeiten und Backlog-Stories per Drag & Drop zuordnen (persistiert).

## Automatisierte Tests

| Datei | Werkzeug | Prüft |
|---|---|---|
| `tests/task-017/useSprintStore.test.ts` | Vitest (`npm run test`) | Store: `addSprint` (order je Projekt), `assignStory` (Story in genau einem Sprint, null = lösen), `removeSprint`, `updateSprint`, `importSuggestions` (anlegen, Duplikate per Name überspringen, Stories aus anderen Sprints lösen) |
| `e2e/sprints.spec.ts` | Playwright (`npm run test:e2e`) | `/sprints` rendert „Nicht zugeordnet" + Sprint; **Drag&Drop** ordnet eine Story einem Sprint zu und die Zuordnung **überlebt einen Reload** |

## Manuelle Tests (Schritt für Schritt)

Vorbereitung: Projekt mit Backlog (Pipeline ausgeführt), `/sprints` öffnen.

### 1. Übersicht & Projektfilter
- [ ] Oben rechts Projekt wählen → Spalten zeigen „Nicht zugeordnet" + Sprints dieses Projekts.
- [ ] Projekt wechseln → andere Stories/Sprints.

### 2. Sprint anlegen / bearbeiten
- [ ] **„Neuer Sprint"** → Name + Ziel + Status → Speichern → Spalte erscheint.
- [ ] Stift-Icon am Sprint → umbenennen / Status ändern (`Geplant`/`Aktiv`/`Abgeschlossen` via Badge) → Speichern.
- [ ] **„Aus Vorschlägen übernehmen"** → Sprints aus den Scrum-Vorschlägen entstehen; erneuter Klick erzeugt keine Duplikate.

### 3. Stories zuordnen (Drag & Drop)
- [ ] Story von „Nicht zugeordnet" in einen Sprint ziehen → Punkte/Anzahl im Header aktualisieren sich.
- [ ] Story von Sprint A nach Sprint B ziehen → sie ist nur noch in B.
- [ ] Tastatur: Karte fokussieren, Leertaste/Pfeile/Leertaste.
- [ ] **Reload** → Zuordnung bleibt erhalten.

### 4. Sprint löschen
- [ ] Sprint bearbeiten → **Löschen** → Spalte weg, seine Stories wieder unter „Nicht zugeordnet".

### 5. Empty-States
- [ ] Ohne Projekte: Hinweis + CTA „Erste Idee anlegen".
- [ ] Projekt ohne Backlog: Hinweis + CTA „Projekt öffnen".

## DoD-Abgleich (`docs/testing-strategy.md`)
- [ ] Drag&Drop-Zuordnung inkl. Tastatur; persistiert über Reload
- [ ] Projektfilter wirkt; Story nie in zwei Sprints
- [ ] Empty-States mit CTA; SSR-sicher (`useHydrated`), kein Hydration-Mismatch
- [ ] Status-Farben nur via `<StatusBadge>`
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build`, `npm run test:e2e` grün
