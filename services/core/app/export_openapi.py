"""Deterministischer OpenAPI-Export des Kerns.

Aufruf (aus services/core): ``uv run python -m app.export_openapi > openapi.json``.
Die Ausgabe ist stabil sortiert (``sort_keys``), damit der Contract-Drift-Check
in der CI nur bei echten Vertragsänderungen anschlägt.
"""

from __future__ import annotations

import json
import sys

from app.main import create_app


def build_openapi() -> dict[str, object]:
    """Erzeugt das OpenAPI-Schema der App (ohne Server zu starten)."""
    return create_app().openapi()


def main() -> None:
    json.dump(build_openapi(), sys.stdout, indent=2, sort_keys=True, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
