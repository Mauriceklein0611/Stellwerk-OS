# Testkonzept – TASK-009: Mock-Agenten-Outputs

Was **automatisiert** getestet wird und was du **manuell** prüfen kannst und sollst.

> Hinweis: TASK-009 ist eine **Service-Schicht ohne eigene UI**. Ein klickbarer
> Trigger („Idee → Pipeline starten → Artefakte ansehen") kommt in TASK-007 (M5).
> Bis dahin wird die Schicht über Unit-Tests + den Dev-Server-Check verifiziert.

## Automatisierte Tests (Vitest)

Ausführen: `npm run test`

| Datei | Prüft |
|---|---|
| `mock-agent-service.test.ts` | Schema-Konformität (Draft vollständig; **≥ 3 Epics**, **jede Story ≥ 2 AKs**; **≥ 4 Risiken**); `runPipeline` liefert alle Artefakte + 1 Run je Agent; **Input-Sensitivität** (zwei Ideen → unterschiedliche Outputs) |
| `pipeline-store.test.ts` | `runPipelineForIdea` schreibt 4 Läufe in den Agent-Store und die Artefakte unter der Idee-id in den Project-Store |
| `architecture.test.ts` | **Seam-Guard:** nur `src/lib/agent-service.ts` importiert die Mock-Implementierung (kein UI-/Store-Code direkt) |

Erwartung: alle grün.

## Manuelle Tests (Schritt für Schritt)

### 1. Tests ausführen
- [ ] `npm run test` → alle grün, insbesondere die drei `task-009`-Dateien.

### 2. Input-Sensitivität sichtbar machen
- [ ] In `src/data/mock-templates.ts` z. B. in `buildDraft` den `summary`-Text leicht ändern (etwa Präfix „Entwurf: ").
- [ ] `npm run test` erneut → der Draft-Test spiegelt die Änderung (bzw. zeigt, dass der Inhalt aus den Bausteinen kommt). Änderung danach zurücknehmen.

### 3. Architektur-Naht
- [ ] Kurz prüfen: Kein Import von `@/lib/mock-agent-service` außerhalb von `src/lib/agent-service.ts` (der Seam-Guard-Test erzwingt das automatisch). UI/Stores nutzen nur `getAgentService()` / `runPipelineForIdea()`.

### 4. App lädt weiterhin fehlerfrei
- [ ] `npm run dev`, App öffnen → Dashboard/Projekte rendern wie zuvor, keine neuen Konsolenfehler (die Service-Schicht ist noch nicht in die UI eingehängt).

## Definition of Done (Abgleich `docs/testing-strategy.md`)
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test` grün
- [ ] Artefakte typisiert, schema-konform (docs/agent-system.md)
- [ ] Kein UI-Code importiert die Mock-Implementierung direkt (nur das Interface)
