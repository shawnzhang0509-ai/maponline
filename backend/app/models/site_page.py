from datetime import datetime

from app import db


class SitePage(db.Model):
    """CMS-style HTML for static routes (about, terms)."""

    __tablename__ = "site_pages"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(32), unique=True, nullable=False, index=True)
    content_html = db.Column(db.Text, nullable=False, default="")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "slug": self.slug,
            "content_html": self.content_html or "",
            "updated_at": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }
