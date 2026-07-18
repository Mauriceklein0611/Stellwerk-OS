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
    # Persistenz (SQLAlchemy 2 + psycopg3-Treiber).
    database_url: str = "postgresql+psycopg://stw:stw@localhost:5432/stellwerk"

    # --- Model Gateway (ADR-006) ---
    # Aktiver Provider: ``stub`` (deterministisch, für alle Tests) oder ``ollama``.
    gateway_provider: str = "stub"
    # Modell-Allowlist (CSV); nur diese Modelle sind über den Gateway erlaubt.
    gateway_models: str = "stub-echo,llama3.2"
    # Basis-URL des Ollama-Servers (nur für den ollama-Provider relevant).
    ollama_url: str = "http://localhost:11434"
    # Timeout/Retry-Verhalten des ollama-Providers.
    gateway_timeout_s: float = 30.0
    gateway_retries: int = 2
    gateway_backoff_s: float = 0.5

    @property
    def allowed_models(self) -> list[str]:
        """Modell-Allowlist als Liste (aus der CSV ``gateway_models``)."""
        return [m.strip() for m in self.gateway_models.split(",") if m.strip()]


@lru_cache
def get_settings() -> Settings:
    """Gecachte Settings-Instanz (per ``cache_clear()`` in Tests zurücksetzbar)."""
    return Settings()
