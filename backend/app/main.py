from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .db import Base, engine
from .routes import public, admin

from fastapi.middleware.cors import CORSMiddleware

# Create DB schema
Base.metadata.create_all(bind=engine)

# Initialize app
app = FastAPI(title="Pixieset-Style Gallery")

# Mount static files (serve uploaded images)
MEDIA_ROOT = Path("media")
app.mount("/media", StaticFiles(directory=MEDIA_ROOT), name="media")

# Include routers
app.include_router(public.router)
app.include_router(admin.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev; restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
def health():
    return {"status": "ok"}
