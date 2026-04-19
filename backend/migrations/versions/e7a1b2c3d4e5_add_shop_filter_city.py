"""add filter_city to shop

Revision ID: e7a1b2c3d4e5
Revises: dbdee6a5a19b
Create Date: 2026-04-18

"""
from alembic import op
import sqlalchemy as sa

revision = "e7a1b2c3d4e5"
down_revision = "dbdee6a5a19b"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("shop", schema=None) as batch_op:
        batch_op.add_column(sa.Column("filter_city", sa.String(length=80), nullable=True))


def downgrade():
    with op.batch_alter_table("shop", schema=None) as batch_op:
        batch_op.drop_column("filter_city")
