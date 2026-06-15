"""Medical Library models."""
from .. import db

BOOK_CATEGORIES = ("free", "paid")


class MedicalBook(db.Model):
    __tablename__ = "medical_books"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(10), nullable=False)  # 'free' | 'paid'
    cover_image = db.Column(db.String(500))
    file_url = db.Column(db.String(500))    # free books only
    price = db.Column(db.String(50))        # paid books only
    buy_url = db.Column(db.String(500))     # paid books only
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "cover_image": self.cover_image,
            "file_url": self.file_url,
            "price": self.price,
            "buy_url": self.buy_url,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
