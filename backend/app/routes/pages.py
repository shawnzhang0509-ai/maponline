import bleach
from flask import Blueprint, jsonify, request

from app import db
from app.models.site_page import SitePage
from app.utils.auth import get_auth_user

pages_bp = Blueprint("pages", __name__, url_prefix="/api")

ALLOWED_TAGS = list(
    bleach.sanitizer.ALLOWED_TAGS.union(
        {
            "p",
            "br",
            "span",
            "div",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "ul",
            "ol",
            "li",
            "strong",
            "em",
            "b",
            "i",
            "u",
            "a",
            "img",
            "blockquote",
            "pre",
            "code",
            "hr",
        }
    )
)
_attrs = dict(bleach.sanitizer.ALLOWED_ATTRIBUTES)
_attrs["a"] = ["href", "title", "rel", "target"]
_attrs["img"] = ["src", "alt", "title", "width", "height", "class"]
ALLOWED_ATTRIBUTES = _attrs


def _sanitize_html(raw: str) -> str:
    if not raw:
        return ""
    return bleach.clean(
        raw,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True,
    )


def _require_admin():
    user = get_auth_user(request)
    if not user or not user.is_admin:
        return None
    return user


@pages_bp.route("/page/<slug>", methods=["GET"])
def get_public_page(slug):
    slug = (slug or "").strip().lower()
    if slug not in ("about", "terms"):
        return jsonify({"error": "Invalid page"}), 400
    row = db.session.query(SitePage).filter_by(slug=slug).first()
    if not row:
        return jsonify({"slug": slug, "content_html": ""})
    return jsonify({"slug": slug, "content_html": row.content_html or ""})


@pages_bp.route("/admin/page", methods=["POST"])
def admin_save_page():
    if not _require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    page = (data.get("page") or "").strip().lower()
    if page not in ("about", "terms"):
        return jsonify({"error": 'page must be "about" or "terms"'}), 400

    content = data.get("content")
    if content is not None and not isinstance(content, str):
        return jsonify({"error": "content must be a string"}), 400
    content = "" if content is None else content

    safe_html = _sanitize_html(content)
    row = db.session.query(SitePage).filter_by(slug=page).first()
    if row:
        row.content_html = safe_html
    else:
        row = SitePage(slug=page, content_html=safe_html)
        db.session.add(row)
    db.session.commit()
    return jsonify({"ok": True, "slug": page, "content_html": safe_html})
