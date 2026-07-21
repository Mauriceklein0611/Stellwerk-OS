---
module: platform
type: adr
status: accepted
updated: 2026-07-21
owner: Maurice
related_issues: [53, 44]
related_adrs: [ADR-011, ADR-014, ADR-026]
superseded_by: null
---

# ADR-015 · Run-Daten, Klassifizierung und Aufbewahrung

- **Status:** accepted
- **Datum:** 2026-07-21
- **Betrifft:** Agent Runtime (`run_payloads`, `run_events`, `agent_runs`), Artifact Store (v0.3)

## Kontext

Nachvollziehbarkeit verlangt, Runs zu speichern. Naiv gespeicherte vollständige
Inputs/Outputs vervielfachen aber personenbezogene oder vertrauliche Inhalte und
erzeugen Datenschutz-/Sicherheitsrisiken. Traceability darf nicht durch
unkontrollierte Kopien erkauft werden.

## Betrachtete Optionen

1. **Alles roh speichern (Metadaten + volle Payloads gemeinsam):** maximale
   Traceability, aber Datenschutz-/Löschbarkeitsproblem — verworfen.
2. **Nichts speichern außer Status:** datenschutzfreundlich, aber nicht
   nachvollziehbar — verworfen.
3. **Metadaten von Inhalten trennen, Inhalte klassifiziert und löschbar (gewählt).**

## Entscheidung

**Metadaten und Inhalte werden getrennt behandelt.** Metadaten (Definition, Version,
Modellparameter, Request-ID, Call-Links, Status, zulässige Hashes) sind standardmäßig
persistierbar. Vollständige Inputs/Outputs liegen nur nach **dokumentierter
Datenklasse** in **getrennt löschbaren** `run_payloads`; **Secrets verboten**,
sensible Felder werden **vor Persistenz redigiert**, Aufbewahrungsdauer konfigurierbar.

Die **effektive Datenklasse** eines Runs ist mindestens die höchste Klasse aus
Definition, Request-Kontext und referenzierten Dokumenten/Payloads; ein Modul darf sie
**nicht herunterstufen**. Fehlende Klassifizierung ⇒ **sicherster konfigurierter
Default**.

Ein Retention-/Löschlauf entfernt Inhalte und hinterlässt nur die nach Daten-/
Rechtskonzept zulässigen Metadaten sowie ggf. Hash/Tombstone. **Hashes, IDs und
Korrelationen können weiterhin personenbeziehbar sein** und sind **nicht automatisch**
von Lösch-/Aufbewahrungspflichten ausgenommen. **Audit-Events enthalten nie Prompt
oder Dokumentinhalt.** Personen werden, soweit möglich, über **pseudonyme
Principal-IDs** statt Klarnamen referenziert. Vor jedem Echtdatenbetrieb wird ein
konkretes Lösch-/Aufbewahrungs-/Berechtigungskonzept fachlich und rechtlich geprüft;
Crypto-Shredding bleibt spätere Option, keine pauschale Lösung.

Bis v0.3 darf der v0.2-Einzelschritt einen **klassifizierten JSON-Output** im
Run-Payload halten; mit Einführung des Artifact Store (v0.3) wird das **Artefakt die
einzige Output-Wahrheit** und der Run hält Referenz + Hash. **Demo und CI verwenden
ausschließlich synthetische Daten.**

## Nicht-Ziele

- Keine Behauptung vollständiger DSGVO-Konformität ohne konkreten Betriebskontext.
- Kein gehärtetes Compliance-Audit (`run_events` = Run-Historie bis v0.4, ADR-018).
- Kein Crypto-Shredding/WORM in v0.2.

## Konsequenzen

- **Positiv:** Traceability **ohne** unkontrollierte Kopien; Design unterstützt
  Löschung und Datenminimierung; ehrliche Reifeaussage.
- **Kosten:** Klassifizierungs-/Redaction-/Retention-Logik; getrennte
  `run_payloads`-Persistenz; Tombstone-Handhabung.
- **Folgeänderungen:** #44 speichert klassifizierten, löschbaren Payload; v0.3 macht
  das Artefakt zur Output-Wahrheit; v0.5 verknüpft die effektive Datenklasse mit der
  Provider-Policy (ADR-026).
