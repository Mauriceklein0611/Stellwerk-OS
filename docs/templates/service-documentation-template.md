---
module: core
type: reference
status: current
updated: YYYY-MM-DD
owner:
related_adrs: []
---

# Dienst · <Name>

> Die maschinelle Wahrheit für HTTP-Schnittstellen ist das generierte OpenAPI +
> `packages/contracts`. Diese Seite **erklärt und verlinkt**, sie dupliziert
> **keine** vollständigen Request-/Response-Schemas.

## Verantwortung

Wofür ist dieser Dienst zuständig, wofür nicht?

## Konsumenten

Wer ruft ihn auf (Module/Rollen) und über welche Grenze (BFF, intern)?

## Authentisierung & Autorisierung

Wie authentifiziert sich der Aufrufer, welche Rollen sind nötig?

## Ablaufbeispiele

Typische Sequenzen (verweisen auf die Endpunkte im OpenAPI).

## Fehlersemantik

Fehlerobjekt-Struktur und -Codes (Verweis auf `error-model.md`).

## Idempotenz

Welche Operationen sind idempotent, wie (Idempotency-Key, Request-Hash)?

## Versionierung

API-Versionsschema und Kompatibilitätszusagen.

## Events

Ausgehende/aufgenommene Events (Verweis auf `event-catalog.md`).

## Degradationsverhalten

Verhalten bei Ausfall von Abhängigkeiten (würdevolle Degradation).
