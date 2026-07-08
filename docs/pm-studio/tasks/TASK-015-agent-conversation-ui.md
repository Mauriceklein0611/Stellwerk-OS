---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

# TASK-015: Konversationale Agenten (Chat-UI)

**Meilenstein:** 7 · **Branch:** `feat/task-015-agent-conversation-ui`

## Ziel
Agenten **dialogfähig** machen. Der **Idee-Agent** arbeitet als **Chat**: Nutzer beschreibt die Idee (Formular = strukturierter Einstieg), der Agent stellt **Rückfragen**, beide iterieren; erst auf **explizite Bestätigung** („Entwurf erstellen") entsteht das Artefakt. Konzept: `docs/agent-system.md` → „Konversationale Agenten".

## Kontext
Ergänzt den bisherigen „Ein-Klick"-Flow (Formular → Draft). Mock-Stufe: deterministische Rückfragen/Antworten; echtes LLM-Backend erst später.

## Betroffene Dateien
- `src/types/index.ts` (AgentMessage, AgentConversation)
- `src/lib/agent-service.ts` / `mock-agent-service.ts` (Konversations-API: `sendMessage`, `finalizeArtifact`)
- `src/store/useConversationStore.ts` (neu) oder Erweiterung
- `src/components/ideas/IdeaChat.tsx` (neu) + Einbindung in `ideas/new`

## Technische Anforderungen
- `AgentConversation` (projectId, targetArtifactType, messages: user/agent).
- Chat-UI: Nachrichtenliste, Eingabe, Rückfragen des Agenten; Formularfelder als optionaler Einstieg.
- Artefakt entsteht **erst** auf explizite Aktion „Entwurf erstellen" (nicht automatisch).
- Mock: deterministische Rückfragen anhand fehlender/dünner Idee-Felder.

## Akzeptanzkriterien
- [ ] Chat mit Rückfragen und Iteration; Verlauf sichtbar
- [ ] Artefakt entsteht erst auf Bestätigung
- [ ] Konversation typisiert im Store; Lint/Typecheck/Test/Build grün + Testkonzept

## Testschritte
1. Idee knapp beschreiben → Agent stellt Rückfrage.
2. Antworten → weitere Iteration.
3. „Entwurf erstellen" → Artefakt entsteht; vorher nicht.

## Erwartetes Ergebnis
Dialogischer Einstieg in die Artefakt-Erzeugung; Grundlage für „Mit Agent überarbeiten" (TASK-016).

## Dokumentation
`docs/agent-system.md` (vorhanden); `task-index.md`.
