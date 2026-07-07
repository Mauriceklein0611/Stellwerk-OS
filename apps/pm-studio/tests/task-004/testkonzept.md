# Testkonzept – TASK-004: Projektideen-Formular

Was **automatisiert** getestet wird und was du **manuell** prüfen kannst und sollst.

## Automatisierte Tests (Vitest)

Ausführen: `npm run test`

| Datei | Prüft |
|---|---|
| `idea-schema.test.ts` | zod-Schema lehnt leere Pflichtfelder ab / akzeptiert valide Idee; `parseFeatures` (Zeilen → Liste); `ideaFromForm` (id, createdAt, status, Features, leere Optionalfelder → undefined) |
| `useProjectStore.test.ts` | `addIdea` stellt neue Idee voran; `removeIdea` entfernt nach id |

Erwartung: **alle grün** (zusammen mit den Tests der vorherigen Tasks).

## Manuelle Tests (Schritt für Schritt)

Vorbereitung: `npm run dev`, http://localhost:3000 öffnen.

### 1. Pflichtfeld-Validierung
- [ ] In der Sidebar **„New Idea"** öffnen (Route `/ideas/new`).
- [ ] Direkt **„Idee anlegen"** klicken (leeres Formular).
- [ ] Erwartet: Inline-Fehlermeldungen unter **Projektname**, **Beschreibung**, **Problem**; kein Redirect.

### 2. Valide Idee anlegen → Redirect → Liste
- [ ] Pflichtfelder ausfüllen (Name, Beschreibung, Problem), bei **Features** mehrere Zeilen eintragen, **Vorgehen** wählen (Agil/Klassisch/Hybrid).
- [ ] **„Idee anlegen"** → wird zu **`/projects`** weitergeleitet.
- [ ] Erwartet: Neue Zeile in der Tabelle mit **Name, Vorgehen, Status „Idee", Erstellt** (heutiges Datum).

### 3. Persistenz über Reload
- [ ] Seite **neu laden** (F5) bzw. Browser schließen/öffnen.
- [ ] Erwartet: Die Idee ist in `/projects` **weiterhin vorhanden** (localStorage-Persistenz, Key `pm-studio-projects`).

### 4. Sortierung der Tabelle
- [ ] In `/projects` mehrere Ideen anlegen.
- [ ] Auf die Spaltenköpfe **Name / Vorgehen / Erstellt** klicken → Sortierung wechselt auf-/absteigend.

### 5. Empty-State
- [ ] In den DevTools `localStorage` leeren (oder im Inkognito-Fenster öffnen) → `/projects` zeigt **„Noch keine Projektideen erfasst."** mit Button „Erste Idee anlegen".

### 6. Responsiveness
- [ ] Fenster auf ~700 px verkleinern → Formularfelder einspaltig, Tabelle ohne horizontales Scrollen lesbar.

## Definition of Done (Abgleich `docs/testing-strategy.md`)
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test` grün
- [ ] Layout bei 1440 / 1024 / 768 geprüft
- [ ] Pflichtfelder validiert; Idee persistiert; erscheint sofort in der Liste
- [ ] Keine hartkodierten Werte im JSX; Typen in `src/types`, Schema in `src/lib`
