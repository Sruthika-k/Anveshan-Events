from fastapi import FastAPI

from . import models
from .db import engine
from .routes_auth import router as auth_router
from .routes_users import router as users_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Anveshan Backend")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(users_router)
