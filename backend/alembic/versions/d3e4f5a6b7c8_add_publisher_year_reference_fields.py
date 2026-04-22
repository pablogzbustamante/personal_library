"""add publisher, year, reference to documents; year to authors

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-04-11 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd3e4f5a6b7c8'
down_revision: Union[str, None] = 'c2d3e4f5a6b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('publisher', sa.String(), nullable=True))
    op.add_column('documents', sa.Column('year', sa.Integer(), nullable=True))
    op.add_column('documents', sa.Column('reference', sa.String(), nullable=True))
    op.add_column('authors', sa.Column('year', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('documents', 'publisher')
    op.drop_column('documents', 'year')
    op.drop_column('documents', 'reference')
    op.drop_column('authors', 'year')
