"""
Fixtures partagées pour tous les tests Localizi.

Usage:
    cd backend
    .\\venv\\Scripts\\python.exe -m pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.database import SessionLocal, engine


# ── Client HTTP (FastAPI TestClient) ──────────────────────────────────────────
@pytest.fixture(scope="session")
def client():
    """Client HTTP qui pointe sur l'app FastAPI réelle."""
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


# ── Session SQLAlchemy brute ──────────────────────────────────────────────────
@pytest.fixture(scope="session")
def db():
    """Session DB directe (lecture seule en général, rollback en fin de suite)."""
    session = SessionLocal()
    yield session
    session.close()


# ── Token admin (si un admin existe en base) ──────────────────────────────────
@pytest.fixture(scope="session")
def admin_token(client):
    """Récupère un token JWT pour le premier admin trouvé, ou None."""
    resp = client.post("/auth/login", json={
        "email": "admin@localizi.tn",
        "password": "Admin1234!"
    })
    if resp.status_code == 200:
        return resp.json().get("access_token")
    return None


# ── Helpers ───────────────────────────────────────────────────────────────────
def pg_enum_values(db_session, enum_name: str) -> set[str]:
    """Renvoie les valeurs actuelles d'un type enum PostgreSQL."""
    result = db_session.execute(
        text(f"SELECT unnest(enum_range(NULL::{enum_name}))::text")
    )
    return {row[0] for row in result}
