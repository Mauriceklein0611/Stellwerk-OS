"""gateway_calls Telemetrie-Tabelle

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-07

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "gateway_calls",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ts", sa.DateTime(timezone=True), nullable=False),
        # "user" ist reserviert – Alembic quotet den Bezeichner automatisch.
        sa.Column("user", sa.String(length=100), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=False),
        sa.Column("completion_tokens", sa.Integer(), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("cost_estimate", sa.Numeric(precision=12, scale=6), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("request_id", sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_gateway_calls_ts", "gateway_calls", ["ts"])
    op.create_index("ix_gateway_calls_user", "gateway_calls", ["user"])
    op.create_index("ix_gateway_calls_provider", "gateway_calls", ["provider"])
    op.create_index("ix_gateway_calls_model", "gateway_calls", ["model"])


def downgrade() -> None:
    op.drop_index("ix_gateway_calls_model", table_name="gateway_calls")
    op.drop_index("ix_gateway_calls_provider", table_name="gateway_calls")
    op.drop_index("ix_gateway_calls_user", table_name="gateway_calls")
    op.drop_index("ix_gateway_calls_ts", table_name="gateway_calls")
    op.drop_table("gateway_calls")
