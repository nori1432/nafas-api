"""Medical Library routes."""
from flask import Blueprint, request

from .. import db
from ..models.library import MedicalBook, BOOK_CATEGORIES
from ..utils.helpers import ok, fail, paginate, serialize_list, save_upload
from ..utils.decorators import jwt_user_required, role_required

bp = Blueprint("library", __name__)


@bp.get("/library/books")
def list_books():
    q = MedicalBook.query.filter_by(is_active=True)
    if (cat := request.args.get("category")) and cat in BOOK_CATEGORIES:
        q = q.filter_by(category=cat)
    q = q.order_by(MedicalBook.created_at.desc())
    items, pag = paginate(q)
    return ok(serialize_list(items), pagination=pag)


@bp.get("/library/books/<int:bid>")
def get_book(bid):
    book = MedicalBook.query.filter_by(id=bid, is_active=True).first_or_404()
    return ok(book.to_dict())


@bp.post("/library/books")
@role_required("national_admin")
def create_book(current_user):
    title = (request.form.get("title") or "").strip()
    if not title:
        data = request.get_json(silent=True) or {}
        title = (data.get("title") or "").strip()
        description = data.get("description", "")
        category = data.get("category", "free")
        cover_image = data.get("cover_image")
        file_url = data.get("file_url")
        price = data.get("price")
        buy_url = data.get("buy_url")
    else:
        data = request.form
        description = data.get("description", "")
        category = data.get("category", "free")
        cover_image = None
        file_url = None
        price = data.get("price")
        buy_url = data.get("buy_url")
        if "cover" in request.files:
            cover_image = save_upload(request.files["cover"], "library/covers")
        if "file" in request.files:
            file_url = save_upload(request.files["file"], "library/files")

    if not title:
        return fail("title is required", 422)
    if category not in BOOK_CATEGORIES:
        return fail(f"category must be one of {BOOK_CATEGORIES}", 422)

    book = MedicalBook(
        title=title,
        description=description,
        category=category,
        cover_image=cover_image,
        file_url=file_url,
        price=price,
        buy_url=buy_url,
    )
    db.session.add(book)
    db.session.commit()
    return ok(book.to_dict(), "Book added", 201)


@bp.put("/library/books/<int:bid>")
@role_required("national_admin")
def update_book(bid, current_user):
    book = MedicalBook.query.get_or_404(bid)
    data = request.get_json(silent=True) or {}
    for f in ("title", "description", "category", "cover_image", "file_url",
              "price", "buy_url", "is_active"):
        if f in data:
            setattr(book, f, data[f])
    if "cover" in request.files:
        book.cover_image = save_upload(request.files["cover"], "library/covers")
    if "file" in request.files:
        book.file_url = save_upload(request.files["file"], "library/files")
    db.session.commit()
    return ok(book.to_dict(), "Book updated")


@bp.delete("/library/books/<int:bid>")
@role_required("national_admin")
def delete_book(bid, current_user):
    book = MedicalBook.query.get_or_404(bid)
    book.is_active = False
    db.session.commit()
    return ok(message="Book removed")


@bp.post("/library/seed")
@role_required("national_admin")
def seed_books(current_user):
    """Idempotent seed — inserts placeholder books only if the table is empty."""
    if MedicalBook.query.count() > 0:
        return ok(message="Already seeded")
    seeds = [
        MedicalBook(
            title="كتاب طبي تجريبي",
            description="كتاب مرجعي تجريبي — سيتم استبداله بالمحتوى الفعلي قريباً.",
            category="free",
            cover_image=None,
            file_url=None,
        ),
        MedicalBook(
            title="دليل الطبيب و الصيدلي",
            description="مرجع طبي وصيدلاني شامل يغطي الأدوية والجرعات والتداخلات الدوائية.",
            category="paid",
            price="1500 DZD",
            buy_url=None,
        ),
    ]
    db.session.add_all(seeds)
    db.session.commit()
    return ok(serialize_list(seeds), "Seeded", 201)
