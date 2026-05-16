"""Wilaya and Commune lookup tables."""
from .. import db


class Wilaya(db.Model):
    __tablename__ = "wilayas"

    id = db.Column(db.Integer, primary_key=True)
    name_ar = db.Column(db.String(100), nullable=False)
    name_en = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(8), unique=True, nullable=False)

    communes = db.relationship("Commune", backref="wilaya", lazy="dynamic")

    def to_dict(self):
        return {"id": self.id, "name_ar": self.name_ar, "name_en": self.name_en, "code": self.code}


class Commune(db.Model):
    __tablename__ = "communes"

    id = db.Column(db.Integer, primary_key=True)
    wilaya_id = db.Column(db.Integer, db.ForeignKey("wilayas.id"), nullable=False)
    name_ar = db.Column(db.String(100), nullable=False)
    name_en = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "wilaya_id": self.wilaya_id,
            "name_ar": self.name_ar,
            "name_en": self.name_en,
        }
