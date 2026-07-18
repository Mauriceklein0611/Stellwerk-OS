"""No-op-DB-Session für die Docker-freie Unit-Suite.

Der Telemetrie-Schreibpfad (#7) committet je Chat-Call in die DB. In der
schnellen Unit-Suite gibt es keine DB – statt einen echten (langsam
scheiternden) Connect zu versuchen, wird ``get_session`` auf diesen No-op-Stub
umgestellt. Die DB-Tests (test_db, test_telemetry_db) nutzen weiter die echte
Session und decken den realen Schreibpfad ab.
"""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any


class NoDbSession:
    """Verschluckt add/commit/rollback – Telemetrie wird zum No-op."""

    def add(self, *_args: Any, **_kwargs: Any) -> None:
        pass

    def add_all(self, *_args: Any, **_kwargs: Any) -> None:
        pass

    def commit(self) -> None:
        pass

    def rollback(self) -> None:
        pass


def override_get_session() -> Iterator[NoDbSession]:
    yield NoDbSession()
