# backend/tests/conftest.py
"""
Pytest fixtures for unit and integration testing.
Uses in-memory SQLite with async sessions to ensure fast, isolated tests.
"""
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Force testing configuration
os.environ["APP_ENV"] = "testing"
os.environ["DEBUG"] = "false"
os.environ["DEMO_MODE"] = "true"
os.environ["DEMO_OTP_CODE"] = "123456"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-agri2value-testing-only-123456789"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["DATABASE_URL_SYNC"] = "sqlite:///:memory:"

from app.database.base import Base, get_db
from app.main import create_app


@pytest_asyncio.fixture(scope="function")
async def test_db_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_db_engine):
    session_factory = async_sessionmaker(
        bind=test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(test_db_engine):
    app = create_app()

    session_factory = async_sessionmaker(
        bind=test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient):
    """Register and log in a test farmer and return Authorization headers."""
    resp = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9876543210", "demo_code": "123456", "full_name": "Ramesh Patil"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
