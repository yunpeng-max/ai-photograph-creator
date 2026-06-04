from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

from app.config import get_settings
from app.routers import auth, generate, points, options, payment

settings = get_settings()

app = FastAPI(title="AI Photograph Creator", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(generate.router, prefix="/api/v1")
app.include_router(points.router, prefix="/api/v1")
app.include_router(options.router, prefix="/api/v1")
app.include_router(payment.router, prefix="/api/v1")

# Serve uploaded images as static files
upload_dir = Path(settings.upload_dir).resolve()
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/images", StaticFiles(directory=str(upload_dir)), name="images")


@app.get("/health")
async def health():
    return {"status": "ok"}
