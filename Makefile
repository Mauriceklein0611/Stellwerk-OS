# Stellwerk – Ein-Befehl-Ergonomie rund um Docker Compose und das Kern-Gate.
#
# Standard-Workflow:  cp .env.example .env && make up
# Die Doppelpunkt-Doku (## ...) wird von `make help` ausgewertet.

COMPOSE       ?= docker compose
PROFILE       ?= core
CORE_DIR      ?= services/core
UV            ?= uv

# Profil-Flag nur setzen, wenn eines gewählt ist (leer = alle Default-Services).
COMPOSE_CORE  = $(COMPOSE) --profile $(PROFILE)

.DEFAULT_GOAL := help

.PHONY: help up down logs seed test lint build contracts

help: ## Diese Übersicht anzeigen
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up: ## Plattform bauen & starten (Kern + Postgres + Migrate-Job), im Hintergrund
	$(COMPOSE_CORE) up -d --build

down: ## Plattform stoppen und Container entfernen (Volumes bleiben erhalten)
	$(COMPOSE_CORE) down

logs: ## Logs aller Services folgen
	$(COMPOSE_CORE) logs -f

seed: ## Seed-Skript im laufenden Kern-Container ausführen (idempotent)
	$(COMPOSE_CORE) exec -T core python scripts/seed.py

build: ## Nur die Images bauen (ohne Start)
	$(COMPOSE_CORE) build

test: ## Kern-Testsuite lokal ausführen (uv erforderlich)
	cd $(CORE_DIR) && $(UV) run pytest

lint: ## Ruff + mypy über den Kern (uv erforderlich)
	cd $(CORE_DIR) && $(UV) run ruff check . && $(UV) run mypy app

contracts: ## OpenAPI aus dem Kern exportieren + TS-Typen generieren + bauen (eincheckbar)
	cd $(CORE_DIR) && $(UV) run python -m app.export_openapi > ../../packages/contracts/openapi.json
	npm run generate -w @stellwerk/contracts
	npm run build -w @stellwerk/contracts
