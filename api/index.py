"""Vercel serverless entry point for NAFAS API."""
import sys
import os

# Add the project root to Python path so `app` package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app

app = create_app()

# Vercel looks for `handler` or `app` as the WSGI callable
handler = app
