from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.core.config import settings

from urllib.parse import urlparse, urlencode, parse_qsl, urlunparse

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Clean up unsupported query parameters for asyncpg
parsed = urlparse(db_url)
query_params = dict(parse_qsl(parsed.query))
query_params.pop("pgbouncer", None)
query_params.pop("schema", None)
if "sslmode" in query_params:
    query_params["ssl"] = query_params.pop("sslmode")
db_url = urlunparse(parsed._replace(query=urlencode(query_params)))

engine = create_async_engine(db_url, echo=True, future=True)

async def init_db():
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
