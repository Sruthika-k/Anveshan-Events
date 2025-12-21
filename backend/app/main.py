from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health

app = FastAPI(title="Anveshan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "Anveshan backend running"}
