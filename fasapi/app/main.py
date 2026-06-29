from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.routes import health, auth
from app.core.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(health.router)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
