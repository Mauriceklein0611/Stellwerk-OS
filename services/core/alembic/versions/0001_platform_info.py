"""platform_info Smoke-Tabelle

Revision ID: 0001
Revises:
Create Date: 2026-07-07

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "platform_info",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", sa.String(length=500), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_platform_info_key", "platform_info", ["key"], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_platform_info_key", table_name="platform_info")
    op.drop_table("platform_info")
