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
    # Bytes explizit als UTF-8 schreiben – unabhängig von der Konsolen-Codepage
    # (Windows würde sonst cp1252 nehmen und Umlaute plattformabhängig machen).
    payload = json.dumps(build_openapi(), indent=2, sort_keys=True, ensure_ascii=False)
    sys.stdout.buffer.write((payload + "\n").encode("utf-8"))


if __name__ == "__main__":
    main()
