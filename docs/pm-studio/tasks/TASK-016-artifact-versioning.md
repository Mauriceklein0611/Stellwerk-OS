---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

# TASK-016: Artefakt-Versionierung & Überarbeitung

**Meilenstein:** 7 · **Branch:** `feat/task-016-artifact-versioning`

## Ziel
Artefakte **versionieren** und jederzeit **mit ihrem Agenten überarbeiten** – unabhängig von Pipeline-Läufen. Jede Version trägt einen vom Agenten generierten Änderungskommentar; jeder Artefakt-Tab zeigt einen Versions-/Aktivitätsverlauf. Konzept: `docs/agent-system.md` → „Artefakt-zentrierte Zusammenarbeit".

## Kontext
Setzt auf TASK-015 (Konversation) und das Versions-Datenmodell auf. Downstream-Konsistenz: Überarbeitung eines früheren Artefakts markiert abhängige als „möglicherweise veraltet".

## Betroffene Dateien
- `src/types/index.ts` (ArtifactVersion, author, changeSummary)
- `src/store/useProjectStore.ts` (Artefakt-Versionen statt einzelner Fassung)
- `src/lib/agent-service.ts` / `mock-agent-service.ts` (`reviseArtifact(artifact, auftrag)` → neue Version + Änderungszusammenfassung)
- `src/components/project/*` (Aktion „Mit Agent überarbeiten" je Tab + Versionsverlauf)

## Technische Anforderungen
- `ArtifactVersion` (version, at, author `agent|human`, reason, changeSummary).
- Pipeline-Schritt erzeugt **Version 1**; Überarbeitungen erzeugen Folgeversionen (auch ohne Lauf).
- Je Tab: Aktion **„Mit Agent überarbeiten"** (Dialog-Panel) + **Versions-/Aktivitätsverlauf** (ältere Versionen einsehbar).
- **Direkte manuelle Edits** erzeugen ebenfalls einen Versionseintrag (`author: "human"`).
- **Downstream-Hinweis:** Überarbeitung eines früheren Artefakts (z. B. Requirements) markiert abhängige (Backlog, Risiken) als „möglicherweise veraltet" + Angebot, Folge-Agenten erneut laufen zu lassen.

## Akzeptanzkriterien
- [ ] Artefakte versioniert; jede Version mit Urheber + Änderungskommentar
- [ ] „Mit Agent überarbeiten" erzeugt eine Folgeversion, die die alte ablöst
- [ ] Versionsverlauf je Tab; ältere Versionen einsehbar; manuelle Edits = eigener Eintrag
- [ ] Downstream-Markierung „möglicherweise veraltet" + Re-Run-Angebot
- [ ] Lint/Typecheck/Test/Build grün + Testkonzept

## Testschritte
1. Pipeline-Schritt → Version 1.
2. „Mit Agent überarbeiten" (Auftrag) → Version 2 mit Änderungskommentar.
3. Requirements überarbeiten → Backlog/Risiken als „möglicherweise veraltet" markiert.

## Erwartetes Ergebnis
Artefakte sind lebendige, versionierte Objekte; Überarbeitung und Nachvollziehbarkeit unabhängig von Läufen.

## Dokumentation
`docs/agent-system.md` (vorhanden); `task-index.md`.
