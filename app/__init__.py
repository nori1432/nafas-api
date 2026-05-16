"""Flask application factory for NAFAS."""
import os
from flask import Flask, jsonify, request, make_response, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

from .config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_class: type = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    try:
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    except OSError:
        pass

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    # Handle CORS manually
    @app.before_request
    def _handle_preflight():
        if request.method == "OPTIONS":
            resp = make_response()
            resp.headers["Access-Control-Allow-Origin"] = "*"
            resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            resp.headers["Access-Control-Max-Age"] = "86400"
            return resp

    @app.after_request
    def _add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        return response

    # Import models so Alembic autogenerate sees them
    from . import models  # noqa: F401

    # Register blueprints
    from .routes.auth import bp as auth_bp
    from .routes.hospitals import bp as hospitals_bp
    from .routes.appointments import bp as appointments_bp
    from .routes.medical_records import bp as records_bp
    from .routes.maintenance import bp as maintenance_bp
    from .routes.donations import bp as donations_bp
    from .routes.complaints import bp as complaints_bp
    from .routes.ratings import bp as ratings_bp
    from .routes.notifications import bp as notifications_bp
    from .routes.admin import bp as admin_bp
    from .routes.hospital_portal import bp as hospital_portal_bp
    from .routes.companies import bp as companies_bp
    from .routes.subscriptions_pub import bp as subscriptions_pub_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(hospitals_bp, url_prefix="/api")
    app.register_blueprint(appointments_bp, url_prefix="/api")
    app.register_blueprint(records_bp, url_prefix="/api")
    app.register_blueprint(maintenance_bp, url_prefix="/api")
    app.register_blueprint(donations_bp, url_prefix="/api")
    app.register_blueprint(complaints_bp, url_prefix="/api")
    app.register_blueprint(ratings_bp, url_prefix="/api")
    app.register_blueprint(notifications_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(hospital_portal_bp, url_prefix="/api/hospital-portal")
    app.register_blueprint(companies_bp, url_prefix="/api/companies")
    app.register_blueprint(subscriptions_pub_bp, url_prefix="/api")

    @app.route("/api/health")
    def health():
        return jsonify({"success": True, "message": "NAFAS API alive", "data": {"status": "ok"}})

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # JWT error handlers -> standard response shape
    @jwt.unauthorized_loader
    def _missing_token(reason):
        return jsonify({"success": False, "message": "Authentication required", "data": None}), 401

    @jwt.invalid_token_loader
    def _invalid_token(reason):
        return jsonify({"success": False, "message": "Invalid token", "data": None}), 401

    @jwt.expired_token_loader
    def _expired_token(jwt_header, jwt_payload):
        return jsonify({"success": False, "message": "Token expired", "data": None}), 401

    @app.errorhandler(404)
    def _not_found(e):
        return jsonify({"success": False, "message": "Not found", "data": None}), 404

    @app.errorhandler(500)
    def _server_error(e):
        return jsonify({"success": False, "message": "Internal server error", "data": None}), 500

    return app
