---
module: platform
type: prd
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: Problem, Zielgruppen und Nutzenversprechen von Stellwerk-OS
related_issues: [62]
---

# Product Brief – Stellwerk-OS

> Kurzfassung des *Warum* und *für wen*. Das langfristige Zielbild steht in
> [vision.md](vision.md), die Reihenfolge in [roadmap.md](roadmap.md), die messbaren
> Ergebnisse in [outcomes.md](outcomes.md).

## Problem

Agentische LLM-Anwendungen entstehen heute oft als isolierte UI-Mocks oder
Einzellösungen ohne nachvollziehbare Ausführung, Kostenkontrolle, menschliche
Freigaben oder belastbare Sicherheits-/Identitätsgrenzen. In regulierten Umfeldern
(z. B. Finanzsektor) ist gerade das der entscheidende Teil – und meist der fehlende.

## Zielgruppen

- **Technische Reviewer / potenzielle Arbeitgeber** (v. a. Finanzsektor), die eine
  kontrollierte, nachvollziehbare Enterprise-AI-Umsetzung bewerten.
- **Software-Architekten**, die Trust-Grenzen, Ownership und Erweiterbarkeit prüfen.
- **Product Owner**, die agentische Abläufe mit menschlicher Kontrolle nutzen.
- **Entwickler künftiger Fachmodule**, die wiederverwendbare Agentik ohne eigene
  Schattenplattform wollen.

## Nutzenversprechen

**Fachmodule erhalten wiederverwendbare Agentik, Kosten- und Modelltransparenz,
menschliche Kontrollpunkte und später gehärtete Identitäts-/Audit-Fähigkeiten, ohne
eigene Schattenplattformen aufzubauen.**

Ein schlanker Kern stellt sechs geteilte Fähigkeiten bereit (Identity, Model Gateway,
Telemetrie/Kosten, Event/Audit, Agent Runtime, Eval); Fachmodule erfüllen einen
kurzen Modul-Vertrag (kein eigenes Login, LLM nur via Gateway, Audit-Pflicht ab dem
ausgewiesenen Reifegrad, einzeln startbar, würdevolle Degradation).

## Reifegrenze (ehrlich)

Stellwerk-OS ist ein **Portfolio- und Lernprojekt**. Vor gesonderter Härtung,
Rechtsprüfung, Skalierungsvalidierung und Betreiberfreigabe ist es **kein**
produktionsfreigegebenes Bankensystem. Begriffe wie „auditierbar", „append-only" oder
„DSGVO-fähig" gelten nur mit der im jeweiligen Meilenstein bewiesenen Reichweite. Details:
[goals-and-non-goals.md](goals-and-non-goals.md).
