# Sicherheitsrichtlinie

Danke, dass du hilfst, Stellwerk sicher zu halten.

## Unterstützte Versionen

Stellwerk befindet sich in der v0.1-Foundation-Phase. Sicherheitsfixes gibt es
für die jeweils **aktuelle Minor-Version** (derzeit `0.1.x`) auf `main`. Ältere
Vorabversionen werden nicht rückportiert.

| Version | Unterstützt |
|---|---|
| `0.1.x` (aktuell) | ✅ |
| `< 0.1` | ❌ |

## Eine Schwachstelle melden

**Bitte keine öffentlichen Issues für Sicherheitslücken.**

Nutze bevorzugt **GitHub Private Vulnerability Reporting**
(Repo → Tab *Security* → *Report a vulnerability*). Alternativ per E-Mail an den
Maintainer (Adresse im GitHub-Profil).

Bitte gib an:

- betroffene Komponente/Version und Umgebung,
- Reproduktionsschritte oder PoC,
- Einschätzung der Auswirkung.

## Was du erwarten kannst

- **Bestätigung** des Eingangs innerhalb von **3 Werktagen**.
- **Erste Einschätzung** (Schweregrad, nächste Schritte) innerhalb von **7 Werktagen**.
- Abstimmung eines **Offenlegungszeitpunkts**; wir nennen dich auf Wunsch als Melder.

## Automatisierte Sicherheitsbasis

Dieses Repo betreibt kontinuierlich:

- **Dependabot** – wöchentliche, gruppierte Dependency-Updates (npm, pip/uv,
  GitHub-Actions, Docker) · [.github/dependabot.yml](.github/dependabot.yml)
- **CodeQL** – statische Analyse (JavaScript/TypeScript + Python), bei PR und
  wöchentlich · [.github/workflows/codeql.yml](.github/workflows/codeql.yml)
- **Trivy** – Image-Scan im CI, blockiert bei behebbaren HIGH/CRITICAL-Findings
  · Ausnahmen dokumentiert in [.trivyignore](.trivyignore)
- **Lizenz-Report** – npm + pip als nicht-blockierender CI-Report

Details zum CI-Sicherheitsprozess: [docs/runbooks/ci.md](docs/runbooks/ci.md).
