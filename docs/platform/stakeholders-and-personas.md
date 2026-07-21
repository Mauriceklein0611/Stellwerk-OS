---
module: platform
type: reference
status: current
updated: 2026-07-21
owner: Maurice
source_of_truth_for: Rollen/Personas, ihre Ziele, Rechte und Missbrauchsfälle
related_issues: [62]
---

# Stakeholder und Personas

Die Rollen, gegen die Features und Sicherheitsgrenzen geprüft werden. Rechte werden
erst ab v0.4 (OIDC/RBAC, [ADR-013](adrs/ADR-013-bff-boundary-identity.md) →
ADR-019) technisch erzwungen; davor sind sie konzeptionell.

## PO – Product Owner / PM-Studio-Nutzer
- **Ziel:** mit agentischer Hilfe schneller planen, ohne Kontrolle abzugeben.
- **Aufgaben/Workflows:** Draft erzeugen (#44), später HITL-Freigaben, Artefakte iterieren.
- **Benötigte Infos:** Draft-Output, Kosten „meines" Laufs, Provenienz.
- **Rechte:** Runs starten, eigene Projektdaten bearbeiten.
- **Fehler/Missbrauch:** übergroße Eingaben (werden abgelehnt, nicht gekürzt); Vertrauen
  in still ersetzte Mock-Ausgaben (verboten – kein stiller Mock-Fallback).

## Reviewer – Mensch am Gate
- **Ziel:** kein Folgeschritt ohne Freigabe (Signal-Prinzip).
- **Aufgaben/Workflows:** Gate prüfen; „Bestätigen / Bearbeiten & bestätigen / Erneut
  mit Feedback"; Inbox anstehender Freigaben.
- **Benötigte Infos:** gerendertes Artefakt, Herkunft, Aggregatversion.
- **Rechte:** Gate-Commands mit erwarteter Version.
- **Fehler/Missbrauch:** Doppelklick/zweiter Reviewer → idempotent bzw. 409; veralteter
  Command darf nichts überschreiben.

## Admin – Plattform
- **Ziel:** Modelle, Kosten, Budgets und Provider-Policy steuern.
- **Aufgaben/Workflows:** Provider zuschalten, Budgets/Rate-Limits, Dashboards.
- **Benötigte Infos:** Kosten mit Provenienz, Budget-Stände/-Verletzungen.
- **Rechte:** Konfiguration, Policy-Versionen.
- **Fehler/Missbrauch:** Cloud-Freigabe vertraulicher Datenklassen (default-deny,
  ADR-026); Budget nur aus gecachtem Snapshot (verboten – atomare Reservierung).

## Auditor – Governance / Compliance
- **Ziel:** Vorgänge rekonstruieren, ohne der App blind zu vertrauen.
- **Aufgaben/Workflows:** Event→Run→Artefaktversion; Filter nach Modul/Actor/Zeit.
- **Benötigte Infos:** korrelierte Metadaten (nie Prompt/Dokumentinhalt im Audit).
- **Rechte:** Lesezugriff (`auditor`), ab v0.4 RBAC-erzwungen.
- **Fehler/Missbrauch:** überverkaufter Audit-Schutz (App-Rollen-Grenze explizit; keine
  DBA-Unveränderlichkeit behaupten).

## Mod-Dev – Modul-Entwickler
- **Ziel:** wiederverwendbare Agentik ohne Core-Sonderlogik oder Schattenplattform.
- **Aufgaben/Workflows:** Manifest registrieren (`pms.draft@1.0.0`), Definitionen versionieren.
- **Benötigte Infos:** Modul-Vertrag, ADRs, generierte Contracts.
- **Rechte:** Definition registrieren (idempotenter Deployment-Schritt).
- **Fehler/Missbrauch:** PM-Semantik in den Core drücken (Reviewfrage „Braucht IDP dafür
  eine Core-Sonderregel?"); Provider-SDK außerhalb des Gateways (Architekturtest, ADR-006).

## Ops – Betrieb
- **Ziel:** installier-, betreib- und wiederherstellbar.
- **Aufgaben/Workflows:** `make up`, Health/Readiness, Backup/Restore, Release/Rollback.
- **Benötigte Infos:** `/readyz`-Grund, Laufzeitmatrix, Runbooks.
- **Rechte:** Deployment/Konfiguration.
- **Fehler/Missbrauch:** unsichere Prod-Defaults (fail-fast, ADR-019/E1.4);
  Zombie-Runs nach Neustart (Reconciler).

## Besucher – Recruiter / Interessent
- **Ziel:** dem Repo in 5 Minuten vertrauen, System und Grenzen ohne Chatwissen verstehen.
- **Aufgaben/Workflows:** README → [docs/README.md](../README.md) → Roadmap → ADRs → Demo.
- **Benötigte Infos:** ehrliche Reifeaussagen, funktionierende Gates, Demo-Tour.
- **Rechte:** nur öffentliche, synthetische Daten (falls je eine Read-only-Demo, dann
  read-only Principal + harte Limits, E16.6).
- **Fehler/Missbrauch:** öffentliche Demo als Abuse-/Kostenvektor (optional, erst nach
  Identity/Guardrails, mit Kill-Switch).
