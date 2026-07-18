"""Deklarative Basis für alle ORM-Modelle."""

from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Gemeinsame Basisklasse; ihr ``metadata`` ist das Alembic-Target."""
