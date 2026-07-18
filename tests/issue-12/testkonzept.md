# Testkonzept – Issue #12: Monitoring-Profil (Prometheus/Grafana) + Release v0.1.0

Infrastruktur + Release. Verifikation überwiegend als Checkliste; der
Monitoring-Teil wurde **live** belegt.

## Live-Verifikation Monitoring (belegt)
```bash
cp .env.example .env
docker compose --profile monitoring up -d --build
# Traffic erzeugen (füllt stw_gateway_*):
for m in stub-echo llama3.2; do
  curl -s -o /dev/null localhost:8000/api/v1/gateway/chat \
    -H 'content-type: application/json' \
    -d "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}]}"
done
```
Ergebnis (nachgewiesen):
- Prometheus-Targets: `stellwerk-core → up`, `prometheus → up`.
- Query `sum by (model)(stw_gateway_calls_total)` liefert Werte je Modell.
- Grafana v11.4.0 gesund; Datasource `prometheus` → „Successfully queried".
- **Beide Dashboards automatisch provisioniert** (Ordner „Stellwerk"):
  `stw-platform` (Plattform), `stw-models-costs` (Modelle & Kosten) – **ohne
  Handkonfiguration**.

## Checkliste (AK)
- [x] `make up`/Compose + Profil `monitoring`: beide Dashboards zeigen Daten
      ohne Handkonfiguration.
- [ ] Release v0.1.0 veröffentlicht: Tag `v0.1.0`, Release-Notes, CHANGELOG,
      GHCR-Images mit `v0.1.0`-Tag (Release-Flow, s. u.).
- [x] README-Quickstart final (drei Befehle + Profile).
- [x] Qualitäts-Gate grün (Monitoring ist Config/YAML; `docker compose config`
      valide, Dashboard-JSON valide).

## Release-Flow v0.1.0 (Schritte)
1. Milestone `v0.1 Foundation`: alle Issues #1–#12 geschlossen.
2. CHANGELOG-Abschnitt `v0.1.0` (nach Modulen) ergänzt.
3. PR `dev → main`: „release: v0.1.0 – Foundation", CI grün, mergen.
4. Tag `v0.1.0` auf `main` → `docker`-Job pusht `ghcr.io/<owner>/<repo>/core`
   mit `0.1.0`/`v0.1.0` + `sha`.
5. `gh release create v0.1.0 --generate-notes`.
6. GHCR: Image-Tags prüfen.

## Definition of Done
- [ ] Monitoring-Profil liefert beide Dashboards mit Daten (belegt)
- [ ] v0.1.0 getaggt, Release veröffentlicht, GHCR-Images vorhanden
- [ ] README final; docs/runbooks/monitoring.md vorhanden
