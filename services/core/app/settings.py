"""Zentrale Konfiguration des Kerns via Pydantic-Settings (Env-Präfix ``STW_``)."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Aus der Umgebung gelesene Einstellungen.

    Alle Variablen tragen den Präfix ``STW_`` (z. B. ``STW_LOG_LEVEL``), damit
    keine ``os.environ``-Streuung im Code entsteht (CLAUDE.md, Code-Standards PY).
    """

    model_config = SettingsConfigDict(
        env_prefix="STW_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "stellwerk-core"
    env: str = "dev"
    log_level: str = "INFO"
    # DevAuth-Rolle (ADR-007): statischer Nutzer, Rolle per Env umschaltbar.
    dev_role: str = "admin"


@lru_cache
def get_settings() -> Settings:
    """Gecachte Settings-Instanz (per ``cache_clear()`` in Tests zurücksetzbar)."""
    return Settings()
